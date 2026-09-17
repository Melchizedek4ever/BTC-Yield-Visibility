import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { stackingDaoAdapter } from '@/adapters/stackingDaoAdapter';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import { describeAdapterContract } from '@/test/adapterContract';

/**
 * Seam under test: enrich(), with StackingDAO's stats endpoint mocked at the
 * network boundary. The adapter's real fetch, parse and fallback code runs.
 *
 * This adapter sets APY only — see the note in stackingDaoAdapter.ts on why
 * the endpoint's single protocol-wide TVL cannot be attributed to one row.
 */

const STATS_URL = 'https://app.stackingdao.com/api/stats';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describeAdapterContract(stackingDaoAdapter);

/** Mirrors the real response shape; tests override only what they assert on. */
function serveStats(overrides: Record<string, unknown> = {}) {
  server.use(
    http.get(STATS_URL, () =>
      HttpResponse.json({
        pox_cycle: 143,
        apy_native: 5.93,
        apy_ststx: 3.39,
        apy_ststxbtc: 3.81,
        apy_stbtc: 2.89,
        stackingdao_tvl: 45_672_574,
        stx_price: 0.249139,
        ...overrides,
      }),
    ),
  );
}

/** A row wired to one of the endpoint's APY keys. */
function stackedOpportunity(key: string, id = `opp-${key}`) {
  return makeOpportunity({
    id,
    apy: 9.2,
    apyBase: 9.2,
    apyReward: 0,
    tvlUsd: 115e6,
    protocol: makeProtocol({ metadata: { stackingDaoApyKey: key } }),
  });
}

describe('live stacking APY', () => {
  test('applies the native PoX rate to the row that asks for it', async () => {
    serveStats();
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(5.93);
    expect(o.scoresEstimated).toBe(false);
    expect(o.isStale).toBe(false);
  });

  test('applies the liquid-stacking rate to the stSTX row', async () => {
    serveStats();
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('ststx')]);
    expect(o.apy).toBe(3.39);
  });

  test('routes each row to its own key in one response', async () => {
    serveStats();
    const [native, ststx, stbtc] = await stackingDaoAdapter.enrich([
      stackedOpportunity('native'),
      stackedOpportunity('ststx'),
      stackedOpportunity('stbtc'),
    ]);
    expect([native.apy, ststx.apy, stbtc.apy]).toEqual([5.93, 3.39, 2.89]);
  });

  test('restates the yield as fully base, never emissions', async () => {
    // Consensus yield is paid from miner commitments, not token emissions.
    // Leaving a stale apyReward behind would feed the sustainability risk
    // factor an emissions share that no longer corresponds to anything.
    serveStats();
    const withReward = { ...stackedOpportunity('native'), apyBase: 4, apyReward: 5.2 };
    const [o] = await stackingDaoAdapter.enrich([withReward]);
    expect(o.apyBase).toBe(5.93);
    expect(o.apyReward).toBe(0);
  });

  test('leaves TVL on whatever the previous stage produced', async () => {
    // The endpoint's only TVL is protocol-wide — see the adapter's header.
    serveStats();
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('ststx')]);
    expect(o.tvlUsd).toBe(115e6);
  });
});

describe('rows this adapter does not claim', () => {
  test('leaves unmarked rows untouched', async () => {
    serveStats();
    const plain = makeOpportunity({ id: 'unmarked' });
    const [o] = await stackingDaoAdapter.enrich([plain]);
    expect(o).toEqual(plain);
  });

  test('leaves coming-soon rows untouched', async () => {
    serveStats();
    const soon = { ...stackedOpportunity('native'), status: 'coming-soon' as const };
    const [o] = await stackingDaoAdapter.enrich([soon]);
    expect(o).toEqual(soon);
  });

  test('asks for nothing when no row is marked', async () => {
    let called = false;
    server.use(
      http.get(STATS_URL, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    await stackingDaoAdapter.enrich([makeOpportunity({ id: 'unmarked' })]);
    expect(called).toBe(false);
  });
});

describe('failure modes', () => {
  test('API error keeps the curated baseline, flagged estimated', async () => {
    server.use(http.get(STATS_URL, () => new HttpResponse(null, { status: 500 })));
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(9.2);
    expect(o.scoresEstimated).toBe(true);
  });

  test('network failure keeps the curated baseline, flagged estimated', async () => {
    server.use(http.get(STATS_URL, () => HttpResponse.error()));
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(9.2);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a key missing from the response keeps that row on its baseline', async () => {
    serveStats({ apy_native: undefined });
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(9.2);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a non-numeric rate is rejected rather than published', async () => {
    serveStats({ apy_native: '5.93' });
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(9.2);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a negative rate is rejected rather than published', async () => {
    serveStats({ apy_native: -1 });
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(9.2);
    expect(o.scoresEstimated).toBe(true);
  });

  test('a zero rate is published — stacking really can pay nothing in a cycle', async () => {
    serveStats({ apy_native: 0 });
    const [o] = await stackingDaoAdapter.enrich([stackedOpportunity('native')]);
    expect(o.apy).toBe(0);
    expect(o.scoresEstimated).toBe(false);
  });

  test('one bad key does not cost the other rows their reading', async () => {
    serveStats({ apy_native: null });
    const [native, ststx] = await stackingDaoAdapter.enrich([
      stackedOpportunity('native'),
      stackedOpportunity('ststx'),
    ]);
    expect(native.scoresEstimated).toBe(true);
    expect(ststx.apy).toBe(3.39);
    expect(ststx.scoresEstimated).toBe(false);
  });
});
