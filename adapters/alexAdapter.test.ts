import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { alexAdapter } from '@/adapters/alexAdapter';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import { describeAdapterContract } from '@/test/adapterContract';

/**
 * Seam under test: enrich(), with ALEX's public pool API mocked at the network
 * boundary. The adapter's real fetch, decode and fallback code runs.
 *
 * ALEX returns every numeric field as an on-chain fixed-point integer scaled
 * by 1e18 — `apr_7d` of 43582955428507760 is 4.358%. The fixtures below use
 * real values read from the live endpoint so the decoding is pinned against
 * reality rather than against a round number someone invented.
 */

const POOLS_URL = 'https://api.alexlab.co/v2/public/pools';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describeAdapterContract(alexAdapter);

/** Pool 13 (STX/ALEX) as the live endpoint returned it. */
const STX_ALEX = {
  pool_id: 13,
  apr_24h: 73844394119198750,
  apr_7d: 43582955428507760,
  balance_x: 5.3513260743086e23,
  balance_y: 4.316457512430802e25,
  total_supply: 2.625644068189434e25,
};

/** Pool 125 (ALEX/sBTC) as the live endpoint returned it — an empty pool. */
const ALEX_SBTC = {
  pool_id: 125,
  apr_24h: 0,
  apr_7d: 0,
  balance_x: 0,
  balance_y: 0,
  total_supply: 0,
};

function servePools(pools: Array<Record<string, unknown>>) {
  server.use(http.get(POOLS_URL, () => HttpResponse.json({ data: pools })));
}

/** A row wired to an ALEX pool. Defaults carry a curated emissions component. */
function alexOpportunity(poolId: number, overrides = {}) {
  return makeOpportunity({
    id: `opp-alex-${poolId}`,
    apy: 45,
    apyBase: 5,
    apyReward: 40,
    protocol: makeProtocol({ metadata: { alexPoolId: poolId } }),
    ...overrides,
  });
}

describe('fee APR from pool state', () => {
  test('decodes the 1e18 fixed-point 7-day APR into a percentage', async () => {
    servePools([STX_ALEX]);
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apyBase).toBeCloseTo(4.36, 2);
  });

  test('prefers the 7-day APR over the 24-hour reading', async () => {
    // 24h is a spot reading one large trade can skew; 7d is what a depositor
    // would actually have earned.
    servePools([STX_ALEX]);
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apyBase).not.toBeCloseTo(7.38, 2);
  });

  test('keeps the curated emissions component and recomputes the total', async () => {
    // The API reports trading fees only. ALEX emissions are paid by a separate
    // farming contract this endpoint says nothing about, so that half stays
    // curated — and the row stays flagged estimated because of it.
    servePools([STX_ALEX]);
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apyReward).toBe(40);
    expect(o.apy).toBeCloseTo(44.36, 2);
    expect(o.scoresEstimated).toBe(true);
  });

  test('marks a fee-only pool fully live', async () => {
    servePools([STX_ALEX]);
    const feeOnly = alexOpportunity(13, { apyBase: 5, apyReward: 0, apy: 5 });
    const [o] = await alexAdapter.enrich([feeOnly]);
    expect(o.apy).toBeCloseTo(4.36, 2);
    expect(o.scoresEstimated).toBe(false);
  });

  test('publishes 0% for an empty pool rather than its curated estimate', async () => {
    // Pool 125 has no liquidity at all. An opportunity nobody can actually
    // take must not display a 22% estimate as though it were available.
    servePools([ALEX_SBTC]);
    const empty = alexOpportunity(125, { apyBase: 4, apyReward: 0, apy: 22.4 });
    const [o] = await alexAdapter.enrich([empty]);
    expect(o.apy).toBe(0);
    expect(o.apyBase).toBe(0);
    expect(o.scoresEstimated).toBe(false);
  });

  test('routes each row to its own pool in one response', async () => {
    servePools([STX_ALEX, ALEX_SBTC]);
    const [farm, sbtc] = await alexAdapter.enrich([
      alexOpportunity(13, { apyBase: 5, apyReward: 0, apy: 5 }),
      alexOpportunity(125, { apyBase: 4, apyReward: 0, apy: 22.4 }),
    ]);
    expect(farm.apy).toBeCloseTo(4.36, 2);
    expect(sbtc.apy).toBe(0);
  });
});

describe('rows this adapter does not claim', () => {
  test('leaves unmarked rows untouched', async () => {
    servePools([STX_ALEX]);
    const plain = makeOpportunity({ id: 'unmarked' });
    const [o] = await alexAdapter.enrich([plain]);
    expect(o).toEqual(plain);
  });

  test('leaves coming-soon rows untouched', async () => {
    servePools([STX_ALEX]);
    const soon = { ...alexOpportunity(13), status: 'coming-soon' as const };
    const [o] = await alexAdapter.enrich([soon]);
    expect(o).toEqual(soon);
  });

  test('asks for nothing when no row is marked', async () => {
    let called = false;
    server.use(
      http.get(POOLS_URL, () => {
        called = true;
        return HttpResponse.json({ data: [] });
      }),
    );
    await alexAdapter.enrich([makeOpportunity({ id: 'unmarked' })]);
    expect(called).toBe(false);
  });
});

describe('failure modes', () => {
  test('API error keeps the curated baseline, flagged estimated', async () => {
    server.use(http.get(POOLS_URL, () => new HttpResponse(null, { status: 500 })));
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apy).toBe(45);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a pool missing from the response keeps that row on its baseline', async () => {
    servePools([STX_ALEX]);
    const [o] = await alexAdapter.enrich([alexOpportunity(999)]);
    expect(o.apy).toBe(45);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a non-numeric APR is rejected rather than published', async () => {
    servePools([{ ...STX_ALEX, apr_7d: '4.36' }]);
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apy).toBe(45);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a negative APR is rejected rather than published', async () => {
    servePools([{ ...STX_ALEX, apr_7d: -1 }]);
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apy).toBe(45);
    expect(o.scoresEstimated).toBe(true);
  });

  test('an implausibly large APR is rejected as a decoding error', async () => {
    // Guards the fixed-point assumption itself: if ALEX ever changes the
    // scaling, the decode fails loudly into the baseline instead of putting a
    // 700,000,000% APY on the dashboard.
    servePools([{ ...STX_ALEX, apr_7d: 4.3582955428507765e26 }]);
    const [o] = await alexAdapter.enrich([alexOpportunity(13)]);
    expect(o.apy).toBe(45);
    expect(o.scoresEstimated).toBe(true);
  });
});
