import { describe, expect, test } from 'vitest';
import { PROTOCOL_REGISTRY } from '@/data/protocolRegistry';
import { MARKET_BASELINE } from '@/data/marketBaseline';
import { createYieldService } from '@/services/yieldService';

/**
 * SOURCE MONITOR — runs against the REAL upstreams, not mocks.
 *
 * Not part of `npm test`. Run nightly on a schedule (`npm run monitor`), where
 * a failure means the world changed, not that someone broke the code.
 *
 * Why this exists: every serious defect this product has had was a TRUTH bug,
 * not a logic bug. A pool paying 0% while we published 3.5%. A TVL wrong by
 * 73x. A row describing a Granite product that never existed. Timeouts set
 * below the endpoint's actual latency, so some adapters had never once
 * succeeded in production. The unit suite was green through every one of them,
 * because mocking the network boundary is exactly what makes those invisible.
 *
 * Everything in the pipeline fails soft, so a broken source never raises an
 * error — it quietly reverts rows to curated estimates. That is why nobody
 * noticed for six months, and why this file asserts rather than logs.
 *
 * The checks are driven by the registry and baseline themselves, so onboarding
 * an opportunity extends the monitor automatically and there is no second list
 * to forget to update.
 */

const TIMEOUT = 120_000;

/** Below this, a refresh is not meaningfully live and someone should look. */
const MIN_LIVE_COVERAGE = 0.5;

/**
 * How far a live TVL may drift from its curated baseline before we call it.
 * Ten-fold is deliberately loose: it must not fire on ordinary market moves,
 * only on the class of error where a figure is wrong by an order of magnitude.
 * Bitflow sat at 73x for months and nothing said a word.
 */
const MAX_TVL_DRIFT = 10;

function baselineFor(id: string) {
  return MARKET_BASELINE.find(m => m.protocolId === id);
}

/**
 * Deliberately far more patient than any adapter's budget. This file answers
 * "does the source still exist and still have the shape we depend on"; whether
 * it answers fast enough for production is a different question, and conflating
 * them turns every slow night into a false alarm.
 *
 * A source that is merely too slow still shows up here — the adapter times out,
 * the row falls back, and the coverage check below reports it by name.
 */
async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(60_000), ...init });
  expect(res.ok, `${url} returned ${res.status}`).toBe(true);
  return res.json();
}

/** Every opportunity we publish, with the identifiers it depends on. */
const listed = PROTOCOL_REGISTRY.filter(r => !r.hiddenReason && r.status === 'live');

describe('mapped identifiers still resolve', () => {
  const pooled = listed.filter(r => r.externalIds.defiLlamaPool);
  test.runIf(pooled.length > 0)(
    'every DefiLlama pool we map still exists',
    async () => {
      for (const r of pooled) {
        const json = (await fetchJson(
          `https://yields.llama.fi/poolsEnriched?pool=${r.externalIds.defiLlamaPool}`,
        )) as { data?: unknown[] };
        expect(
          json.data?.length,
          `${r.id}: DefiLlama pool ${r.externalIds.defiLlamaPool} returned nothing — the pool was ` +
            'retired or re-keyed, and this row has silently been on curated estimates since.',
        ).toBeGreaterThan(0);
      }
    },
    TIMEOUT,
  );

  const alexPools = listed.filter(r => typeof r.externalIds.alexPoolId === 'number');
  test.runIf(alexPools.length > 0)(
    'every ALEX pool we map still exists, and the 1e18 scaling still holds',
    async () => {
      const json = (await fetchJson('https://api.alexlab.co/v2/public/pools')) as {
        data?: Array<{ pool_id?: number; apr_7d?: number; fee_rate_x?: number }>;
      };
      for (const r of alexPools) {
        const pool = json.data?.find(p => p.pool_id === r.externalIds.alexPoolId);
        expect(pool, `${r.id}: ALEX pool ${r.externalIds.alexPoolId} is gone`).toBeDefined();

        // The fixed-point scale is undocumented and inferred from the swap fee
        // arriving as 5e15 for a 0.5% pool. If ALEX ever rescales, every APR we
        // publish moves by a factor of 1e10 — so pin the assumption, not just
        // the value.
        const feeRatePct = (pool!.fee_rate_x ?? 0) / 1e18 * 100;
        expect(
          feeRatePct,
          `${r.id}: ALEX swap fee decoded as ${feeRatePct}% — the 1e18 fixed-point ` +
            'assumption in alexAdapter no longer holds.',
        ).toBeLessThan(10);
      }
    },
    TIMEOUT,
  );

  const bitflowPools = listed.filter(r => r.externalIds.bitflowPool);
  test.runIf(bitflowPools.length > 0)(
    'every Bitflow pool we map still exists',
    async () => {
      const rows = (await fetchJson(
        'https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker',
      )) as Array<{ pool_id?: string }>;
      for (const r of bitflowPools) {
        expect(
          rows.some(p => p.pool_id === r.externalIds.bitflowPool),
          `${r.id}: Bitflow pool ${r.externalIds.bitflowPool} is no longer listed`,
        ).toBe(true);
      }
    },
    TIMEOUT,
  );

  const sdaoRows = listed.filter(r => r.externalIds.stackingDaoApyKey);
  test.runIf(sdaoRows.length > 0)(
    'every StackingDAO rate key still exists and is numeric',
    async () => {
      const stats = (await fetchJson('https://app.stackingdao.com/api/stats')) as Record<
        string,
        unknown
      >;
      for (const r of sdaoRows) {
        const field = `apy_${r.externalIds.stackingDaoApyKey}`;
        expect(
          typeof stats[field],
          `${r.id}: StackingDAO no longer returns a numeric ${field}`,
        ).toBe('number');
      }
    },
    TIMEOUT,
  );

  const velarRows = listed.filter(r => r.externalIds.velarPool);
  test.runIf(velarRows.length > 0)(
    'every Velar pool we map still exists',
    async () => {
      for (const r of velarRows) {
        const json = (await fetchJson(
          `https://api.velar.co/pools/${r.externalIds.velarPool}`,
        )) as { stats?: unknown };
        expect(json.stats, `${r.id}: Velar pool returned no stats`).toBeDefined();
      }
    },
    TIMEOUT,
  );

  test(
    'PoX chain state still reports a stacked balance',
    async () => {
      const json = (await fetchJson('https://api.hiro.so/v2/pox')) as {
        current_cycle?: { stacked_ustx?: number };
      };
      expect(json.current_cycle?.stacked_ustx, 'Hiro PoX returned no stacked_ustx').toBeGreaterThan(
        0,
      );
    },
    TIMEOUT,
  );
});

describe('the pipeline end to end', () => {
  test(
    'a real refresh keeps most rows on live readings',
    async () => {
      // Default deps on purpose: once the telemetry work lands, its records
      // print into this run's log and become the diagnostics for a failure.
      const { protocols } = await createYieldService().getDashboard();
      const rateable = protocols.filter(p => p.status !== 'coming-soon' && !p.unpublishedRate);
      const live = rateable.filter(p => !p.scoresEstimated);
      const coverage = live.length / rateable.length;

      const estimated = rateable.filter(p => p.scoresEstimated).map(p => p.id);
      expect(
        coverage,
        `live coverage fell to ${Math.round(coverage * 100)}% — on estimates: ${estimated.join(', ')}`,
      ).toBeGreaterThanOrEqual(MIN_LIVE_COVERAGE);
    },
    TIMEOUT,
  );

  test(
    'no live TVL has drifted an order of magnitude from its baseline',
    async () => {
      // The check that would have caught Bitflow's 73x error within a day.
      // A baseline this far from the live reading is stale enough that the
      // fallback would itself be a wrong number if a source went down.
      const { protocols } = await createYieldService().getDashboard();
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

      expect(drifted, `stale baselines in data/marketBaseline.ts:\n  ${drifted.join('\n  ')}`).toEqual(
        [],
      );
    },
    TIMEOUT,
  );

  test(
    'every published APY is within a range a reader could believe',
    async () => {
      // Not a correctness check — a decoding check. A fixed-point or unit error
      // upstream shows up here as a number no Bitcoin yield product pays.
      const { protocols } = await createYieldService().getDashboard();
      for (const p of protocols) {
        if (p.unpublishedRate) continue;
        expect(p.apy, `${p.id} published APY ${p.apy}`).toBeGreaterThanOrEqual(0);
        expect(p.apy, `${p.id} published APY ${p.apy} — check the source's encoding`).toBeLessThan(
          500,
        );
      }
    },
    TIMEOUT,
  );
});
