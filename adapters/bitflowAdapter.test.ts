import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { bitflowAdapter } from '@/adapters/bitflowAdapter';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import { describeAdapterContract } from '@/test/adapterContract';

/**
 * Seam under test: enrich(), with Bitflow's public ticker endpoint mocked at
 * the network boundary. The adapter's real fetch, match and fallback code runs.
 *
 * This adapter sets TVL only — see the adapter header on why the ticker's
 * volume figures cannot be turned into a fee APR.
 */

const TICKER_URL = 'https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describeAdapterContract(bitflowAdapter);

const SBTC_STX_POOL = 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1';
const SBTC_PBTC_POOL = 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-sbtc-pbtc-v-1-1';

/** Values as the live endpoint returned them. */
function serveTicker(pools: Array<{ pool_id: string; liquidity_in_usd: unknown }>) {
  server.use(http.get(TICKER_URL, () => HttpResponse.json(pools)));
}

function bitflowOpportunity(poolId: string) {
  return makeOpportunity({
    id: `opp-${poolId.slice(-12)}`,
    apy: 14.2,
    tvlUsd: 5_000_000,
    protocol: makeProtocol({ metadata: { bitflowPool: poolId } }),
  });
}

describe('pool liquidity', () => {
  test('applies the live USD liquidity as TVL', async () => {
    serveTicker([{ pool_id: SBTC_STX_POOL, liquidity_in_usd: 68107.4821 }]);
    const [o] = await bitflowAdapter.enrich([bitflowOpportunity(SBTC_STX_POOL)]);
    expect(o.tvlUsd).toBe(68107); // whole dollars
    expect(o.scoresEstimated).toBe(false);
  });

  test('leaves APY on whatever the previous stage produced', async () => {
    serveTicker([{ pool_id: SBTC_STX_POOL, liquidity_in_usd: 68107 }]);
    const [o] = await bitflowAdapter.enrich([bitflowOpportunity(SBTC_STX_POOL)]);
    expect(o.apy).toBe(14.2);
  });

  test('routes each row to its own pool in one response', async () => {
    serveTicker([
      { pool_id: SBTC_STX_POOL, liquidity_in_usd: 68107 },
      { pool_id: SBTC_PBTC_POOL, liquidity_in_usd: 140508 },
    ]);
    const [stx, pbtc] = await bitflowAdapter.enrich([
      bitflowOpportunity(SBTC_STX_POOL),
      bitflowOpportunity(SBTC_PBTC_POOL),
    ]);
    expect(stx.tvlUsd).toBe(68107);
    expect(pbtc.tvlUsd).toBe(140508);
  });
});

describe('rows this adapter does not claim', () => {
  test('leaves unmarked rows untouched', async () => {
    serveTicker([{ pool_id: SBTC_STX_POOL, liquidity_in_usd: 68107 }]);
    const plain = makeOpportunity({ id: 'unmarked' });
    const [o] = await bitflowAdapter.enrich([plain]);
    expect(o).toEqual(plain);
  });

  test('leaves coming-soon rows untouched', async () => {
    serveTicker([{ pool_id: SBTC_STX_POOL, liquidity_in_usd: 68107 }]);
    const soon = { ...bitflowOpportunity(SBTC_STX_POOL), status: 'coming-soon' as const };
    const [o] = await bitflowAdapter.enrich([soon]);
    expect(o).toEqual(soon);
  });

  test('asks for nothing when no row is marked', async () => {
    let called = false;
    server.use(
      http.get(TICKER_URL, () => {
        called = true;
        return HttpResponse.json([]);
      }),
    );
    await bitflowAdapter.enrich([makeOpportunity({ id: 'unmarked' })]);
    expect(called).toBe(false);
  });
});

describe('failure modes', () => {
  test('API error keeps the curated baseline, flagged estimated', async () => {
    server.use(http.get(TICKER_URL, () => new HttpResponse(null, { status: 500 })));
    const [o] = await bitflowAdapter.enrich([bitflowOpportunity(SBTC_STX_POOL)]);
    expect(o.tvlUsd).toBe(5_000_000);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a pool missing from the response keeps that row on its baseline', async () => {
    serveTicker([{ pool_id: SBTC_PBTC_POOL, liquidity_in_usd: 140508 }]);
    const [o] = await bitflowAdapter.enrich([bitflowOpportunity(SBTC_STX_POOL)]);
    expect(o.tvlUsd).toBe(5_000_000);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a non-numeric liquidity is rejected rather than published', async () => {
    serveTicker([{ pool_id: SBTC_STX_POOL, liquidity_in_usd: '68107' }]);
    const [o] = await bitflowAdapter.enrich([bitflowOpportunity(SBTC_STX_POOL)]);
    expect(o.tvlUsd).toBe(5_000_000);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a zero balance is rejected — an emptied pool reads the same as a gap', async () => {
    // Unlike a rate, a balance of exactly 0 for a pool we track is far more
    // likely a reporting gap than a real state, and nothing corroborates it.
    serveTicker([{ pool_id: SBTC_STX_POOL, liquidity_in_usd: 0 }]);
    const [o] = await bitflowAdapter.enrich([bitflowOpportunity(SBTC_STX_POOL)]);
    expect(o.tvlUsd).toBe(5_000_000);
    expect(o.scoresEstimated).toBe(true);
  });
});
