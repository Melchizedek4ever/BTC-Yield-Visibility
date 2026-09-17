import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { defillamaAdapter, fetchStacksChainTvl } from '@/adapters/defillamaAdapter';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import { describeAdapterContract } from '@/test/adapterContract';

/**
 * Seam under test: enrich() + fetchStacksChainTvl(), with HTTP mocked at the
 * network boundary (MSW) — the adapter's real fetch/parse/fallback code runs.
 *
 * The adapter keeps a module-level last-known-good cache keyed by pool id, so
 * every test uses its own unique pool id to stay isolated at the public seam.
 */

const POOLS_URL = 'https://yields.llama.fi/poolsEnriched';
const CHAIN_TVL_URL = 'https://api.llama.fi/v2/historicalChainTvl/Stacks';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describeAdapterContract(defillamaAdapter);

/** A live opportunity wired to a DefiLlama pool, baseline APY range 4–8. */
function makePooledOpportunity(poolId: string) {
  return makeOpportunity({
    id: `opp-${poolId}`,
    apy: 6,
    apyRange: { min: 4, max: 8 },
    tvlUsd: 30e6,
    protocol: makeProtocol({ metadata: { defiLlamaPool: poolId } }),
  });
}

/**
 * Stands in for the per-pool endpoint: it answers for the single pool id in
 * the query string, so a test that serves nothing for an id reproduces a real
 * unmatched pool rather than an empty whole-list response.
 *
 * `apy`/`tvlUsd` are nullable because DefiLlama genuinely returns null for
 * "no reading" and 0 for "this pool pays nothing" — the distinction this
 * adapter exists to preserve. `apyMean30d` is the pool's own 30-day average,
 * which is what corroborates a zero reading.
 */
interface ServedPool {
  pool: string;
  apy: number | null;
  tvlUsd: number | null;
  apyMean30d?: number | null;
}

function servePools(pools: ServedPool[]) {
  server.use(
    http.get(POOLS_URL, ({ request }) => {
      const wanted = new URL(request.url).searchParams.get('pool');
      const match = pools.filter(p => p.pool === wanted);
      return HttpResponse.json({ status: 'success', data: match });
    }),
  );
}

describe('enrichment with live data', () => {
  test('applies in-range live APY/TVL and marks the row live', async () => {
    servePools([{ pool: 'p-live', apy: 5.4321, tvlUsd: 42e6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-live')]);
    expect(o.apy).toBe(5.43); // rounded to 2dp
    expect(o.tvlUsd).toBe(42e6);
    expect(o.isStale).toBe(false);
    expect(o.scoresEstimated).toBe(false);
  });

  test('leaves coming-soon opportunities untouched', async () => {
    servePools([{ pool: 'p-soon', apy: 5, tvlUsd: 42e6 }]);
    const soon = { ...makePooledOpportunity('p-soon'), status: 'coming-soon' as const };
    const [o] = await defillamaAdapter.enrich([soon]);
    expect(o).toEqual(soon);
  });

  test('keeps seed values as estimates when the pool has no live match', async () => {
    servePools([]);
    const seedRow = makePooledOpportunity('p-unmatched');
    const [o] = await defillamaAdapter.enrich([seedRow]);
    expect(o.apy).toBe(seedRow.apy);
    expect(o.tvlUsd).toBe(seedRow.tvlUsd);
    expect(o.scoresEstimated).toBe(true);
    expect(o.isStale).toBe(false);
  });
});

describe('failure modes', () => {
  test('API error keeps seed values as estimates', async () => {
    server.use(http.get(POOLS_URL, () => new HttpResponse(null, { status: 500 })));
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-500')]);
    expect(o.apy).toBe(6);
    expect(o.scoresEstimated).toBe(true);
  });

  test('network failure keeps seed values as estimates', async () => {
    server.use(http.get(POOLS_URL, () => HttpResponse.error()));
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-neterr')]);
    expect(o.apy).toBe(6);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a null TVL keeps the seed TVL rather than publishing $0', async () => {
    servePools([{ pool: 'p-null-tvl', apy: 5, tvlUsd: null }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-null-tvl')]);
    expect(o.apy).toBe(5);
    expect(o.tvlUsd).toBe(30e6); // the seed value, not 0
  });

  test('a null APY is a missing reading — keeps the seed estimate', async () => {
    servePools([{ pool: 'p-null-apy', apy: null, tvlUsd: 42e6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-null-apy')]);
    expect(o.apy).toBe(6);
    expect(o.tvlUsd).toBe(42e6); // a missing APY says nothing about the TVL
    expect(o.scoresEstimated).toBe(true);
  });
});

/**
 * The Zest case, and the reason this adapter was changed: DefiLlama reported
 * 0% for Zest's sBTC pool with 192 observations behind it, and the dashboard
 * showed a curated 3.5% instead. A pool that pays nothing is a finding a
 * reader deserves, not an error to be papered over.
 */
describe('a genuine zero reading', () => {
  test("publishes 0% when the pool's own 30-day mean confirms it", async () => {
    servePools([{ pool: 'p-true-zero', apy: 0, tvlUsd: 50e6, apyMean30d: 0.00687 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-true-zero')]);
    expect(o.apy).toBe(0);
    expect(o.tvlUsd).toBe(50e6);
    expect(o.isStale).toBe(false);
    expect(o.scoresEstimated).toBe(false);
  });

  test("rejects a zero that contradicts the pool's own history", async () => {
    // A pool averaging 6% that suddenly reads 0 is a data error, not a rate cut.
    servePools([{ pool: 'p-suspect-zero', apy: 0, tvlUsd: 50e6, apyMean30d: 6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-suspect-zero')]);
    expect(o.apy).toBe(6); // the seed baseline
    expect(o.scoresEstimated).toBe(true);
  });

  test('rejects a zero with no history to corroborate it', async () => {
    servePools([{ pool: 'p-bare-zero', apy: 0, tvlUsd: 50e6, apyMean30d: null }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-bare-zero')]);
    expect(o.apy).toBe(6);
    expect(o.scoresEstimated).toBe(true);
  });
});

describe('per-pool request isolation', () => {
  test('one failing pool does not cost the others their live reading', async () => {
    // The whole-list fetch this replaced was all-or-nothing: a single bad
    // upstream response dropped every row back to seed estimates at once.
    server.use(
      http.get(POOLS_URL, ({ request }) => {
        const wanted = new URL(request.url).searchParams.get('pool');
        if (wanted === 'p-broken') return new HttpResponse(null, { status: 500 });
        return HttpResponse.json({ status: 'success', data: [{ pool: wanted, apy: 6, tvlUsd: 40e6 }] });
      }),
    );

    const [broken, healthy] = await defillamaAdapter.enrich([
      makePooledOpportunity('p-broken'),
      makePooledOpportunity('p-healthy'),
    ]);

    expect(broken.scoresEstimated).toBe(true); // fell back to its seed baseline
    expect(healthy.apy).toBe(6); // unaffected by its neighbour
    expect(healthy.scoresEstimated).toBe(false);
  });

  test('asks only for the pools it maps, one request each', async () => {
    const requested: string[] = [];
    server.use(
      http.get(POOLS_URL, ({ request }) => {
        const wanted = new URL(request.url).searchParams.get('pool');
        requested.push(wanted ?? '(unfiltered)');
        return HttpResponse.json({ status: 'success', data: [] });
      }),
    );

    await defillamaAdapter.enrich([
      makePooledOpportunity('p-one'),
      makePooledOpportunity('p-two'),
      { ...makePooledOpportunity('p-soon-2'), status: 'coming-soon' as const },
    ]);

    // Never an unfiltered call: that is the 11MB whole-list download.
    expect(requested.sort()).toEqual(['p-one', 'p-two']);
  });
});

describe('anomaly rejection and stale fallback', () => {
  // Baseline midpoint is 6, so readings below 1.2 (80% under) are anomalies.
  test('anomalous reading falls back to the last accepted live value, flagged stale', async () => {
    const opp = makePooledOpportunity('p-anomaly');

    servePools([{ pool: 'p-anomaly', apy: 5.5, tvlUsd: 40e6 }]);
    await defillamaAdapter.enrich([opp]); // seeds last-known-good

    servePools([{ pool: 'p-anomaly', apy: 0.4, tvlUsd: 41e6 }]);
    const [o] = await defillamaAdapter.enrich([opp]);
    expect(o.apy).toBe(5.5);
    // TVL is its own reading: rejecting the APY must not discard it.
    expect(o.tvlUsd).toBe(41e6);
    expect(o.isStale).toBe(true);
    expect(o.scoresEstimated).toBe(false);
  });

  test('anomalous reading with no prior good value keeps the seed baseline', async () => {
    servePools([{ pool: 'p-anomaly-cold', apy: 0.4, tvlUsd: 41e6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-anomaly-cold')]);
    expect(o.apy).toBe(6);
    expect(o.tvlUsd).toBe(41e6); // the TVL reading was never in doubt
    expect(o.isStale).toBe(false);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a low-but-plausible reading is accepted, not rejected', async () => {
    // 1.5 is >20% of the 6 baseline — a real market move, not a data error.
    servePools([{ pool: 'p-low-real', apy: 1.5, tvlUsd: 42e6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-low-real')]);
    expect(o.apy).toBe(1.5);
    expect(o.isStale).toBe(false);
  });
});

describe('chain TVL', () => {
  test('returns the most recent TVL reading', async () => {
    server.use(
      http.get(CHAIN_TVL_URL, () =>
        HttpResponse.json([
          { date: 1, tvl: 100e6 },
          { date: 2, tvl: 123e6 },
        ])
      )
    );
    expect(await fetchStacksChainTvl()).toBe(123e6);
  });

  test('fails soft to 0 on API error or empty history', async () => {
    server.use(http.get(CHAIN_TVL_URL, () => new HttpResponse(null, { status: 500 })));
    expect(await fetchStacksChainTvl()).toBe(0);

    server.use(http.get(CHAIN_TVL_URL, () => HttpResponse.json([])));
    expect(await fetchStacksChainTvl()).toBe(0);
  });
});
