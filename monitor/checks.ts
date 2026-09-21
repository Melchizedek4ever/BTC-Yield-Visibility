import { PROTOCOL_REGISTRY } from '@/data/protocolRegistry';
import { MARKET_BASELINE } from '@/data/marketBaseline';
import { createYieldService } from '@/services/yieldService';

/**
 * SOURCE CHECKS — the monitor's actual logic, independent of how it is run.
 *
 * Two callers: a vitest suite (`npm run monitor`, for a human at a terminal)
 * and a scheduled API route (for the nightly run). Keeping the logic here means
 * the thing that runs nightly is the same code a developer runs by hand, rather
 * than a second implementation that drifts from it.
 *
 * Why this exists at all: every serious defect this product has had was a TRUTH
 * bug, not a logic bug. A pool paying 0% while we published 3.5%. A TVL wrong by
 * 73x. A row describing a Granite product that never existed. Timeouts below an
 * endpoint's real latency, so some adapters had never once succeeded. The unit
 * suite was green through all of them, because mocking the network boundary is
 * exactly what makes that class invisible.
 *
 * It matters more here than in most products because everything in the pipeline
 * fails soft. A broken source never raises an error — it quietly reverts rows to
 * curated estimates and keeps serving. Uptime stays perfect while the numbers
 * rot, which is how six months passed unnoticed.
 *
 * Checks RETURN failures rather than throwing, so one dead upstream cannot hide
 * the state of everything after it. A nightly report that stops at the first
 * problem is a report that takes a week to surface the second one.
 */

/** Below this share of rateable rows on live readings, someone should look. */
const MIN_LIVE_COVERAGE = 0.5;

/**
 * How far a live TVL may drift from its curated baseline before we call it.
 * Ten-fold is deliberately loose: it must not fire on ordinary market moves,
 * only on the class of error where a figure is wrong by an order of magnitude.
 * Bitflow sat at 73x for months and nothing said a word.
 */
const MAX_TVL_DRIFT = 10;

/** Above this, an APY implies a decoding error rather than a market. */
const MAX_PLAUSIBLE_APY = 500;

/**
 * Far more patient than any adapter's budget. This module answers "does the
 * source still exist, with the shape we depend on"; whether it answers fast
 * enough for production is a different question, and conflating them turns
 * every slow night into a false alarm.
 *
 * A source that is merely too slow still surfaces here — its adapter times out,
 * the row falls back, and the coverage check names it.
 */
const FETCH_TIMEOUT_MS = 60_000;

export interface CheckResult {
  name: string;
  ok: boolean;
  /** Present when ok is false. Written to be actionable without context. */
  detail?: string;
}

export interface SourceReport {
  ok: boolean;
  ranAt: string;
  durationMs: number;
  checks: CheckResult[];
}

const listed = PROTOCOL_REGISTRY.filter(r => !r.hiddenReason && r.status === 'live');

function baselineFor(id: string) {
  return MARKET_BASELINE.find(m => m.protocolId === id);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

/** Runs one check, turning any throw into a reported failure. */
async function check(name: string, run: () => Promise<string | null>): Promise<CheckResult> {
  try {
    const failure = await run();
    return failure ? { name, ok: false, detail: failure } : { name, ok: true };
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

// ── Individual checks ──────────────────────────────────────────────────────

async function checkDefiLlamaPools(): Promise<string | null> {
  const pooled = listed.filter(r => r.externalIds.defiLlamaPool);
  const missing: string[] = [];
  for (const r of pooled) {
    const json = (await fetchJson(
      `https://yields.llama.fi/poolsEnriched?pool=${r.externalIds.defiLlamaPool}`,
    )) as { data?: unknown[] };
    if (!json.data?.length) missing.push(`${r.id} (pool ${r.externalIds.defiLlamaPool})`);
  }
  return missing.length
    ? `DefiLlama returned nothing for: ${missing.join(', ')}. The pool was retired or re-keyed, ` +
        'and these rows have silently been on curated estimates since.'
    : null;
}

async function checkAlexPools(): Promise<string | null> {
  const pools = listed.filter(r => typeof r.externalIds.alexPoolId === 'number');
  if (pools.length === 0) return null;

  const json = (await fetchJson('https://api.alexlab.co/v2/public/pools')) as {
    data?: Array<{ pool_id?: number; fee_rate_x?: number }>;
  };
  const problems: string[] = [];
  for (const r of pools) {
    const pool = json.data?.find(p => p.pool_id === r.externalIds.alexPoolId);
    if (!pool) {
      problems.push(`${r.id}: ALEX pool ${r.externalIds.alexPoolId} is gone`);
      continue;
    }
    // The fixed-point scale is undocumented and inferred from the swap fee
    // arriving as 5e15 for a 0.5% pool. If ALEX ever rescales, every APR we
    // publish moves by a factor of 1e10 — so pin the assumption, not the value.
    const feeRatePct = ((pool.fee_rate_x ?? 0) / 1e18) * 100;
    if (feeRatePct >= 10) {
      problems.push(
        `${r.id}: ALEX swap fee decoded as ${feeRatePct}% — the 1e18 fixed-point ` +
          'assumption in alexAdapter no longer holds',
      );
    }
  }
  return problems.length ? problems.join('; ') : null;
}

async function checkBitflowPools(): Promise<string | null> {
  const pools = listed.filter(r => r.externalIds.bitflowPool);
  if (pools.length === 0) return null;

  const rows = (await fetchJson(
    'https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker',
  )) as Array<{ pool_id?: string }>;
  const missing = pools
    .filter(r => !rows.some(p => p.pool_id === r.externalIds.bitflowPool))
    .map(r => r.id);
  return missing.length ? `no longer listed on Bitflow: ${missing.join(', ')}` : null;
}

async function checkStackingDaoKeys(): Promise<string | null> {
  const rows = listed.filter(r => r.externalIds.stackingDaoApyKey);
  if (rows.length === 0) return null;

  const stats = (await fetchJson('https://app.stackingdao.com/api/stats')) as Record<
    string,
    unknown
  >;
  const missing = rows
    .filter(r => typeof stats[`apy_${r.externalIds.stackingDaoApyKey}`] !== 'number')
    .map(r => `${r.id} (apy_${r.externalIds.stackingDaoApyKey})`);
  return missing.length ? `StackingDAO no longer returns a number for: ${missing.join(', ')}` : null;
}

async function checkVelarPools(): Promise<string | null> {
  const rows = listed.filter(r => r.externalIds.velarPool);
  const missing: string[] = [];
  for (const r of rows) {
    const json = (await fetchJson(`https://api.velar.co/pools/${r.externalIds.velarPool}`)) as {
      stats?: unknown;
    };
    if (!json.stats) missing.push(r.id);
  }
  return missing.length ? `Velar returned no stats for: ${missing.join(', ')}` : null;
}

async function checkPoxChainState(): Promise<string | null> {
  const json = (await fetchJson('https://api.hiro.so/v2/pox')) as {
    current_cycle?: { stacked_ustx?: number };
  };
  const stacked = json.current_cycle?.stacked_ustx;
  return typeof stacked === 'number' && stacked > 0
    ? null
    : 'Hiro PoX reported no stacked_ustx — stacking TVL has no source this cycle';
}

// ── Pipeline checks, all sharing one refresh ───────────────────────────────

type Dashboard = Awaited<ReturnType<ReturnType<typeof createYieldService>['getDashboard']>>;

function checkCoverage({ protocols }: Dashboard): string | null {
  const rateable = protocols.filter(p => p.status !== 'coming-soon' && !p.unpublishedRate);
  if (rateable.length === 0) return 'no rateable rows at all — the pipeline produced nothing';

  const estimated = rateable.filter(p => p.scoresEstimated);
  const coverage = (rateable.length - estimated.length) / rateable.length;
  return coverage < MIN_LIVE_COVERAGE
    ? `live coverage fell to ${Math.round(coverage * 100)}% — on curated estimates: ${estimated
        .map(p => p.id)
        .join(', ')}`
    : null;
}

function checkTvlDrift({ protocols }: Dashboard): string | null {
  // The check that would have caught Bitflow's 73x error within a day. A
  // baseline this far from the live reading is stale enough that the fallback
  // would itself be a wrong number if the source went down.
  const drifted: string[] = [];
  for (const p of protocols) {
    if (p.status === 'coming-soon' || p.scoresEstimated) continue;
    const baseline = baselineFor(p.id);
    if (!baseline || baseline.tvlUsd <= 0 || p.tvlUsd <= 0) continue;

    const ratio = Math.max(p.tvlUsd / baseline.tvlUsd, baseline.tvlUsd / p.tvlUsd);
    if (ratio > MAX_TVL_DRIFT) {
      drifted.push(
        `${p.id}: baseline $${Math.round(baseline.tvlUsd).toLocaleString()} vs live ` +
          `$${Math.round(p.tvlUsd).toLocaleString()} (${ratio.toFixed(1)}x)`,
      );
    }
  }
  return drifted.length ? `stale baselines in data/marketBaseline.ts — ${drifted.join('; ')}` : null;
}

function checkPlausibleApy({ protocols }: Dashboard): string | null {
  // Not a correctness check, a decoding check: a unit or fixed-point error
  // upstream surfaces as a number no Bitcoin yield product pays.
  const implausible = protocols
    .filter(p => !p.unpublishedRate && (p.apy < 0 || p.apy >= MAX_PLAUSIBLE_APY))
    .map(p => `${p.id} at ${p.apy}%`);
  return implausible.length
    ? `check the source's encoding — ${implausible.join(', ')}`
    : null;
}

/**
 * Runs every check and reports all of them.
 *
 * The identifier checks run concurrently against independent upstreams. The
 * pipeline checks share a single refresh, because three separate ones would
 * triple the runtime to re-read the same numbers.
 */
export async function runSourceChecks(): Promise<SourceReport> {
  const startedAt = Date.now();

  const identifierChecks = await Promise.all([
    check('defillama pools resolve', checkDefiLlamaPools),
    check('alex pools resolve and the 1e18 scaling holds', checkAlexPools),
    check('bitflow pools resolve', checkBitflowPools),
    check('stackingdao rate keys resolve', checkStackingDaoKeys),
    check('velar pools resolve', checkVelarPools),
    check('pox chain state reports a stacked balance', checkPoxChainState),
  ]);

  let dashboard: Dashboard | null = null;
  const refresh = await check('a real refresh completes', async () => {
    dashboard = await createYieldService().getDashboard();
    return null;
  });

  const pipelineChecks: CheckResult[] = dashboard
    ? [
        { name: 'live coverage holds', ...toResult(checkCoverage(dashboard)) },
        { name: 'no TVL has drifted from its baseline', ...toResult(checkTvlDrift(dashboard)) },
        { name: 'every published APY is plausible', ...toResult(checkPlausibleApy(dashboard)) },
      ]
    : [];

  const checks = [...identifierChecks, refresh, ...pipelineChecks];
  return {
    ok: checks.every(c => c.ok),
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    checks,
  };
}

function toResult(failure: string | null): { ok: boolean; detail?: string } {
  return failure ? { ok: false, detail: failure } : { ok: true };
}
