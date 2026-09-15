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

const POOLS_URL = 'https://yields.llama.fi/pools';
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

function servePools(pools: Array<{ pool: string; apy: number; tvlUsd: number }>) {
  server.use(http.get(POOLS_URL, () => HttpResponse.json({ data: pools })));
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

  test('zero live APY is treated as missing, not applied', async () => {
    servePools([{ pool: 'p-zero', apy: 0, tvlUsd: 42e6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-zero')]);
    expect(o.apy).toBe(6);
    expect(o.scoresEstimated).toBe(true);
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
    expect(o.tvlUsd).toBe(40e6);
    expect(o.isStale).toBe(true);
    expect(o.scoresEstimated).toBe(false);
  });

  test('anomalous reading with no prior good value keeps the seed baseline', async () => {
    servePools([{ pool: 'p-anomaly-cold', apy: 0.4, tvlUsd: 41e6 }]);
    const [o] = await defillamaAdapter.enrich([makePooledOpportunity('p-anomaly-cold')]);
    expect(o.apy).toBe(6);
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
