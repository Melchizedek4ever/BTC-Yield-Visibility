import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { velarAdapter } from '@/adapters/velarAdapter';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import { describeAdapterContract } from '@/test/adapterContract';

/**
 * Seam under test: enrich(), with HTTP mocked at the network boundary (MSW).
 * Velar's API is looked up per-pool (GET /pools/:lpTokenContractAddress),
 * unlike DefiLlama's single bulk /pools list — each test mocks the specific
 * contract address the opportunity under test carries.
 */

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describeAdapterContract(velarAdapter);

function makeVelarOpportunity(lpToken: string) {
  return makeOpportunity({
    id: `opp-${lpToken}`,
    apy: 1.26,
    apyRange: { min: 0.5, max: 3 },
    tvlUsd: 86_516,
    protocol: makeProtocol({ metadata: { velarPool: lpToken } }),
  });
}

function servePool(lpToken: string, stats: { apy: number | string; tvlUsd: number } | null) {
  server.use(
    http.get(`https://api.velar.co/pools/${lpToken}`, () => {
      if (stats === null) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json({
        symbol: 'STX-sBTC',
        lpTokenContractAddress: lpToken,
        stats: { apy: stats.apy, tvl_usd: { value: stats.tvlUsd } },
      });
    })
  );
}

describe('enrichment with live data', () => {
  test('applies live apy/tvlUsd and marks the row live', async () => {
    servePool('lp-live', { apy: 2.4321, tvlUsd: 90_000 });
    const [o] = await velarAdapter.enrich([makeVelarOpportunity('lp-live')]);
    expect(o.apy).toBe(2.43); // rounded to 2dp
    expect(o.tvlUsd).toBe(90_000);
    expect(o.scoresEstimated).toBe(false);
  });

  test('leaves opportunities with no velarPool untouched', async () => {
    const noPool = makeOpportunity({ id: 'no-pool', protocol: makeProtocol({ metadata: {} }) });
    const [o] = await velarAdapter.enrich([noPool]);
    expect(o).toEqual(noPool);
  });

  test('leaves coming-soon opportunities untouched', async () => {
    servePool('lp-soon', { apy: 2, tvlUsd: 90_000 });
    const soon = { ...makeVelarOpportunity('lp-soon'), status: 'coming-soon' as const };
    const [o] = await velarAdapter.enrich([soon]);
    expect(o).toEqual(soon);
  });
});

describe('failure modes', () => {
  test('pool not found (404) keeps seed values as estimates', async () => {
    servePool('lp-404', null);
    const seedRow = makeVelarOpportunity('lp-404');
    const [o] = await velarAdapter.enrich([seedRow]);
    expect(o.apy).toBe(seedRow.apy);
    expect(o.tvlUsd).toBe(seedRow.tvlUsd);
    expect(o.scoresEstimated).toBe(true);
  });

  test('network failure keeps seed values as estimates', async () => {
    server.use(http.get('https://api.velar.co/pools/lp-neterr', () => HttpResponse.error()));
    const seedRow = makeVelarOpportunity('lp-neterr');
    const [o] = await velarAdapter.enrich([seedRow]);
    expect(o.apy).toBe(seedRow.apy);
    expect(o.scoresEstimated).toBe(true);
  });

  test('the "--" no-data sentinel keeps seed values as estimates', async () => {
    servePool('lp-nodata', { apy: '--', tvlUsd: 90_000 });
    const seedRow = makeVelarOpportunity('lp-nodata');
    const [o] = await velarAdapter.enrich([seedRow]);
    expect(o.apy).toBe(seedRow.apy);
    expect(o.scoresEstimated).toBe(true);
  });

  test('zero live apy is treated as missing, not applied', async () => {
    servePool('lp-zero', { apy: 0, tvlUsd: 90_000 });
    const seedRow = makeVelarOpportunity('lp-zero');
    const [o] = await velarAdapter.enrich([seedRow]);
    expect(o.apy).toBe(seedRow.apy);
    expect(o.scoresEstimated).toBe(true);
  });
});
