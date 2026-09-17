import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * DATA SOURCE — StackingDAO stats endpoint (Tier 2: protocol-native).
 *
 * What it is: the read cache behind StackingDAO's own app, run by the team
 * that operates the stacking infrastructure. It publishes realized APYs for
 * the products they run AND for native PoX stacking itself, which they
 * measure because their own liquid-stacking rate is derived from it.
 *
 * Why it matters disproportionately: PoX pays in Bitcoin transferred by
 * miners each ~2-week cycle, so "the current stacking APY" is not a number
 * any contract exposes — it has to be derived from realized reward payouts
 * over a cycle. hiroPoxAdapter deliberately refuses to do that derivation
 * (see its header: the reward feed can understate a payout twofold). This
 * endpoint is an operator who already does it, and publishes the result.
 * That makes it the most reliable stacking APY available to us today.
 *
 * Trust caveat, stated plainly: this is a protocol-native figure, so it ranks
 * below a chain read and above an aggregator. StackingDAO has an interest in
 * their own rate looking good. We take it because the alternative is a human
 * guess, which is strictly worse — but a chain-derived cycle yield should
 * replace it when we build one.
 *
 * APY ONLY, deliberately. The endpoint's `stackingdao_tvl` is a single
 * protocol-wide total covering stSTX, stSTXbtc and stBTC together; pinning it
 * to any one row would overstate that row by the size of the others — the
 * same double-counting trap `stacksPox` guards against in the registry.
 *
 * Fails soft: no response, or a rate that is missing, non-numeric or
 * negative, and the row keeps its curated baseline flagged `scoresEstimated`.
 */

const STATS_URL = 'https://app.stackingdao.com/api/stats';
const TIMEOUT_MS = 6_000;

/**
 * Maps a registry marker to the field on the response. Named keys rather than
 * raw field names so the registry never has to know the endpoint's schema.
 */
const APY_FIELD: Record<string, string> = {
  native: 'apy_native',
  ststx: 'apy_ststx',
  ststxbtc: 'apy_ststxbtc',
  stbtc: 'apy_stbtc',
};

type StatsResponse = Record<string, unknown>;

async function fetchStats(): Promise<StatsResponse | null> {
  try {
    const res = await fetch(STATS_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    return (await res.json()) as StatsResponse;
  } catch {
    return null;
  }
}

/**
 * A rate is publishable only if it is a finite, non-negative number. Zero is
 * allowed: a stacking cycle really can pay nothing, and a reader deserves to
 * see that rather than a curated figure standing in for it.
 */
function readRate(stats: StatsResponse, key: string): number | null {
  const field = APY_FIELD[key];
  if (!field) return null;
  const raw = stats[field];
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : null;
}

export const stackingDaoAdapter: EnrichmentAdapter = {
  source: 'stackingdao',
  getMetadata(): AdapterMetadata {
    return {
      source: 'stackingdao',
      description: 'Realized stacking APY from StackingDAO, including native PoX',
      kind: 'enrichment',
    };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return []; // enrichment-only source
  },
  async enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]> {
    const claimed = opps.filter(
      o => o.status !== 'coming-soon' && o.protocol.metadata.stackingDaoApyKey,
    );
    // Nothing mapped: ask for nothing. Keeps a refresh cheap when this source
    // is registered but no row claims it.
    if (claimed.length === 0) return opps;

    const stats = await fetchStats();
    const claimedIds = new Set(claimed.map(o => o.id));

    return opps.map(o => {
      if (!claimedIds.has(o.id)) return o; // not this adapter's concern

      const rate = stats ? readRate(stats, o.protocol.metadata.stackingDaoApyKey as string) : null;
      if (rate === null) {
        return { ...o, isStale: false, scoresEstimated: true };
      }

      return {
        ...o,
        apy: rate,
        // Stacking yield is a consensus payout from miner commitments, not a
        // token emission. Restating the split keeps the sustainability risk
        // factor honest — a stale apyReward left beside a fresh apy would
        // imply an emissions share that no longer corresponds to anything.
        apyBase: rate,
        apyReward: 0,
        updatedAt: new Date().toISOString(),
        isStale: false,
        scoresEstimated: false,
      };
    });
  },
};
