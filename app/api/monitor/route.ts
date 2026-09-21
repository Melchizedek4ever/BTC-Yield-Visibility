import { NextResponse } from 'next/server';
import { runSourceChecks, type SourceReport } from '@/monitor/checks';

/**
 * Nightly source monitor, scheduled by Vercel Cron (see vercel.json).
 *
 * Checks our data sources against reality rather than against mocks. Runs the
 * same `runSourceChecks()` a developer runs at a terminal via `npm run monitor`,
 * so the scheduled run and the manual one cannot diverge.
 *
 * It lives on Vercel rather than in GitHub Actions because Actions cannot start
 * at all under the account's billing lock — see docs/data-sources/02-open-questions.md.
 * Vercel Cron on the free plan allows one run per day, which is exactly the
 * cadence this needs.
 *
 * WHY IT MATTERS THAT THIS RUNS AT ALL: everything in the pipeline fails soft.
 * A broken upstream never takes the site down; it quietly reverts rows to
 * curated estimates while uptime stays perfect. Without something asking the
 * question on a schedule, wrong numbers are served indefinitely — which is
 * precisely what happened for six months.
 */

// Reads live third-party APIs, so it must never be prerendered or cached.
export const dynamic = 'force-dynamic';

/**
 * Generous on purpose. The checks take roughly 10s, but they are at the mercy
 * of six third-party endpoints and the whole point of the run is to notice when
 * one of them is unwell — timing out before we can observe that would defeat it.
 */
export const maxDuration = 60;

/**
 * Vercel Cron signs scheduled requests with CRON_SECRET when it is configured.
 * Without the check anyone could hammer an endpoint that makes a dozen upstream
 * calls. Requests are allowed through when no secret is set so the route stays
 * usable before it is configured — the deployment is public either way, and a
 * report about our own data is not sensitive.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * Sends a failure to Telegram when a bot is configured. Optional by design: an
 * unreachable notifier must not turn a data-source warning into a 500 that
 * hides the report it was trying to deliver.
 */
async function notify(report: SourceReport): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const failures = report.checks.filter(c => !c.ok);
  const text = [
    'BTC Yield — source monitor FAILED',
    '',
    ...failures.map(f => `• ${f.name}\n  ${f.detail ?? 'no detail'}`),
    '',
    'The dashboard has NOT gone down. Affected rows have reverted to curated',
    'estimates and are serving stale numbers. Run `npm run monitor` locally.',
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Nowhere useful to report this; the response body still carries the report
    // and the non-200 status still marks the cron run as failed.
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const report = await runSourceChecks();
  if (!report.ok) await notify(report);

  // A non-200 is what marks the run as failed in Vercel's cron log, which is
  // the record someone scrolls back through after the fact. The body carries
  // the detail either way.
  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
