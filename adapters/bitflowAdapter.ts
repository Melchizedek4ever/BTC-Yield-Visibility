import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * DATA SOURCE — Bitflow public ticker (Tier 2: protocol-native).
 *
 * What it is: the single public endpoint behind Bitflow's SDK, listing every
 * pool on their DEX with liquidity already denominated in USD. Bitflow runs
 * both an XYK AMM and stableswap pools, plus a route aggregator over the rest
 * of Stacks — the aggregator is execution, not yield, so we ignore it here.
 *
 * Why this one matters: `liquidity_in_usd` is a real dollar figure, not token
 * units, so unlike ALEX no price feed is needed. It is also where our curated
 * data was most wrong — the sBTC-STX pool was carried at $5,000,000 against a
 * live reading two orders of magnitude smaller.
 *
 * TVL ONLY, deliberately. The endpoint reports `base_volume` in token units
 * and publishes no per-pool fee rate, so a fee APR would need both a price for
 * the base token and a fee parameter read from the pool contract. Two
 * inferences stacked on each other is how you get a confident wrong number;
 * until the contract read exists, APY stays curated and flagged.
 *
 * Fails soft: no response, no matching pool, or a non-numeric/zero liquidity,
 * and the row keeps its curated baseline flagged `scoresEstimated`.
 *
 * Note: an API key unlocks more of Bitflow's SDK data (fee rates among them).
 * Worth asking for — it is the cheapest route to a real Bitflow APY.
 */

const TICKER_URL = 'https://bitflow-sdk-api-gateway-7owjsmt8.uc.gateway.dev/ticker';
const TIMEOUT_MS = 6_000;

interface TickerRow {
  pool_id?: unknown;
  liquidity_in_usd?: unknown;
}

async function fetchTicker(): Promise<Map<string, TickerRow> | null> {
  try {
    const res = await fetch(TICKER_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    const rows = (await res.json()) as TickerRow[];
    if (!Array.isArray(rows)) return null;
    return new Map(
      rows.filter(r => typeof r.pool_id === 'string').map(r => [r.pool_id as string, r]),
    );
  } catch {
    return null;
  }
}

/**
 * A balance is publishable only if it is a positive finite number. Zero is
 * rejected rather than published: unlike a rate, which can legitimately be
 * nothing, a balance of exactly 0 for a pool we actively track is far more
 * likely a reporting gap, and nothing here corroborates it.
 */
function readLiquidity(row: TickerRow | undefined): number | null {
  const raw = row?.liquidity_in_usd;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null;
  // Whole dollars: cents on a pool balance are false precision, and the
  // underlying token prices move further between refreshes than the rounding.
  return Math.round(raw);
}

export const bitflowAdapter: EnrichmentAdapter = {
  source: 'bitflow',
  getMetadata(): AdapterMetadata {
    return {
      source: 'bitflow',
      description: 'Pool liquidity in USD from Bitflow’s public ticker',
      kind: 'enrichment',
    };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return []; // enrichment-only source
  },
  async enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]> {
    const claimed = opps.filter(
      o => o.status !== 'coming-soon' && o.protocol.metadata.bitflowPool,
    );
    // Nothing mapped: ask for nothing. Keeps a refresh cheap when this source
    // is registered but no row claims it.
    if (claimed.length === 0) return opps;

    const byPoolId = await fetchTicker();
    const claimedIds = new Set(claimed.map(o => o.id));

    return opps.map(o => {
      if (!claimedIds.has(o.id)) return o; // not this adapter's concern

      const tvlUsd = byPoolId
        ? readLiquidity(byPoolId.get(o.protocol.metadata.bitflowPool as string))
        : null;
      if (tvlUsd === null) {
        return { ...o, isStale: false, scoresEstimated: true };
      }

      return {
        ...o,
        tvlUsd,
        // APY is left on whatever the previous stage produced — see the header.
        updatedAt: new Date().toISOString(),
        isStale: false,
        scoresEstimated: false,
      };
    });
  },
};
