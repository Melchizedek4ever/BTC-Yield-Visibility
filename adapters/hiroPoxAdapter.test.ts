import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { hiroPoxAdapter } from '@/adapters/hiroPoxAdapter';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import { describeAdapterContract } from '@/test/adapterContract';

/**
 * Seam under test: enrich(), with both upstreams mocked at the network
 * boundary. The adapter's real fetch, parse and fallback code runs.
 *
 * This adapter sets TVL only. Stacking APY would have to be derived from
 * burnchain reward payouts, and the reward feed returns a single reward_index
 * per burn block — if PoX is paying a slot the feed omits, a derived APY is
 * understated by a factor of two. `stacked_ustx` needs no such inference.
 */

const POX_URL = 'https://api.hiro.so/v2/pox';
const PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describeAdapterContract(hiroPoxAdapter);

function servePox(stackedUstx: number) {
  server.use(
    http.get(POX_URL, () =>
      HttpResponse.json({ reward_cycle_id: 143, current_cycle: { id: 143, stacked_ustx: stackedUstx } }),
    ),
  );
}

function servePrice(usd: number) {
  server.use(http.get(PRICE_URL, () => HttpResponse.json({ blockstack: { usd } })));
}

/** The single row marked as the whole PoX stacking pool. */
function poxOpportunity() {
  return makeOpportunity({
    id: 'native-stacking',
    apy: 9.2,
    tvlUsd: 200_000_000,
    protocol: makeProtocol({ metadata: { stacksPox: true } }),
  });
}

describe('stacking TVL from the PoX pool', () => {
  test('values the stacked pool at the live STX price', async () => {
    // 441,576,024.260845 STX at $0.25 = $110,394,006.065..., to whole dollars
    servePox(441_576_024_260_845);
    servePrice(0.25);

    const [o] = await hiroPoxAdapter.enrich([poxOpportunity()]);

    expect(o.tvlUsd).toBe(110_394_006);
    expect(o.scoresEstimated).toBe(false);
  });

  test('does not touch the APY, which it cannot read', async () => {
    servePox(441_576_024_260_845);
    servePrice(0.25);

    const [o] = await hiroPoxAdapter.enrich([poxOpportunity()]);

    expect(o.apy).toBe(9.2); // the curated baseline, untouched
  });

  test('preserves the curated baseline for comparison', async () => {
    servePox(441_576_024_260_845);
    servePrice(0.25);

    const [o] = await hiroPoxAdapter.enrich([poxOpportunity()]);

    expect(o.baseline.tvlUsd).toBe(30e6); // whatever the factory supplied
  });
});

describe('scope', () => {
  test('leaves rows that are not the PoX pool untouched', async () => {
    servePox(441_576_024_260_845);
    servePrice(0.25);
    const other = makeOpportunity({ id: 'some-lp', tvlUsd: 5_000_000 });

    const [o] = await hiroPoxAdapter.enrich([other]);

    expect(o).toEqual(other);
  });

  test('leaves coming-soon rows untouched', async () => {
    servePox(441_576_024_260_845);
    servePrice(0.25);
    const soon = { ...poxOpportunity(), status: 'coming-soon' as const };

    const [o] = await hiroPoxAdapter.enrich([soon]);

    expect(o).toEqual(soon);
  });

  test('makes no network calls when no row is mapped to PoX', async () => {
    // No handlers registered: onUnhandledRequest 'error' turns any call into a
    // failure, so this passing proves the adapter asked for nothing.
    const rows = [makeOpportunity({ id: 'unmapped' })];

    const [o] = await hiroPoxAdapter.enrich(rows);

    expect(o).toEqual(rows[0]);
  });
});

describe('failure modes', () => {
  test('keeps the curated TVL when the PoX endpoint fails', async () => {
    server.use(http.get(POX_URL, () => new HttpResponse(null, { status: 503 })));
    servePrice(0.25);

    const [o] = await hiroPoxAdapter.enrich([poxOpportunity()]);

    expect(o.tvlUsd).toBe(200_000_000);
    expect(o.scoresEstimated).toBe(true);
  });

  test('keeps the curated TVL when the price is unavailable', async () => {
    // A stacked amount without a price is not a dollar figure. Publishing the
    // STX count as though it were USD would be far worse than staying curated.
    servePox(441_576_024_260_845);
    server.use(http.get(PRICE_URL, () => new HttpResponse(null, { status: 429 })));

    const [o] = await hiroPoxAdapter.enrich([poxOpportunity()]);

    expect(o.tvlUsd).toBe(200_000_000);
    expect(o.scoresEstimated).toBe(true);
  });

  test('rejects a non-positive stacked amount rather than publishing zero TVL', async () => {
    servePox(0);
    servePrice(0.25);

    const [o] = await hiroPoxAdapter.enrich([poxOpportunity()]);

    expect(o.tvlUsd).toBe(200_000_000);
    expect(o.scoresEstimated).toBe(true);
  });
});
