import { beforeAll, describe, expect, test } from 'vitest';
import { runSourceChecks, type SourceReport } from './checks';

/**
 * SOURCE MONITOR — runs against the REAL upstreams, not mocks.
 *
 * Not part of `npm test`. This is the terminal-facing way to run the checks in
 * monitor/checks.ts; the nightly run calls that same module through
 * app/api/monitor/route.ts, so what runs on a schedule is the code a human runs
 * by hand rather than a second implementation that drifts from it.
 *
 * A failure here means the WORLD changed — a pool retired, an endpoint
 * reshaped, a baseline gone stale — not that someone broke the code.
 *
 * Every check runs ONCE in beforeAll and the results are asserted separately,
 * so one dead upstream cannot hide the state of everything after it. A report
 * that stops at the first problem takes a week to surface the second one.
 */

let report: SourceReport;

beforeAll(async () => {
  report = await runSourceChecks();
}, 180_000);

describe('the run itself', () => {
  test('every check reported a verdict, and every failure gave a reason', () => {
    expect(report.checks.length).toBeGreaterThan(0);
    // A check that fails without a reason is a check that has quietly stopped
    // protecting anything.
    for (const c of report.checks) {
      if (!c.ok) expect(c.detail, `${c.name} failed without a reason`).toBeTruthy();
    }
  });

  test('the run did real work', () => {
    // Not a latency assertion — a smoke signal that it actually reached the
    // network rather than short-circuiting on an empty registry.
    expect(report.durationMs).toBeGreaterThan(0);
  });
});

describe('data sources', () => {
  test('nothing we depend on has changed under us', () => {
    const failures = report.checks.filter(c => !c.ok).map(f => `${f.name} — ${f.detail}`);
    expect(
      failures,
      'see monitor/README.md; start by assuming the world changed, not the code',
    ).toEqual([]);
  });
});
