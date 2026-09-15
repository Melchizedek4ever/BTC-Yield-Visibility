import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * Enrichment adapter: overlays live APY/TVL from DefiLlama onto already-normalized
 * opportunities, matched strictly by pool ID (never by project — that could stamp
 * an unrelated pool's yield onto a row). Fails soft: on any error or missing match,
 * the opportunity keeps its seed values, flagged `scoresEstimated`.
 *
 * A live reading more than 80% below the midpoint of the opportunity's own
 * apyRange is treated as a DefiLlama data error rather than a real market move
 * (matches the anomaly-detection behavior documented on /methodology) — it's
 * rejected in favor of the last accepted live value, flagged `isStale`.
 */

// Per-pool endpoint, not the full /pools dump. /pools returns every pool
// DefiLlama tracks — 16k rows, ~11MB, well over a minute on a cold fetch —
// to extract the handful we map, and it does not honour a chain filter.
// This form answers in under a kilobyte.
const POOLS_URL = 'https://yields.llama.fi/poolsEnriched';
const CHAIN_TVL_URL = 'https://api.llama.fi/v2/historicalChainTvl/Stacks';
const POOLS_TIMEOUT_MS = 6_000;
const TVL_TIMEOUT_MS = 3_000;

interface LiveSnapshot { apy: number; tvlUsd: number }
const lastKnownGood: Record<string, LiveSnapshot> = {};

function isAnomalousApy(apyRange: { min: number; max: number }, liveApy: number): boolean {
  const baseline = (apyRange.min + apyRange.max) / 2;
  return liveApy < baseline * 0.2;
}

async function fetchPool(poolId: string): Promise<{ apy: number; tvlUsd: number } | null> {
  try {
    const url = `${POOLS_URL}?pool=${encodeURIComponent(poolId)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(POOLS_TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    const json = (await res.json()) as { data?: Array<{ apy: number | null; tvlUsd: number | null }> };
    const row = json.data?.[0];
    if (!row) return null;
    return { apy: row.apy ?? 0, tvlUsd: row.tvlUsd ?? 0 };
  } catch {
    return null;
  }
}

/**
 * One request per mapped pool, in parallel. A pool that errors or times out
 * drops out on its own, so one bad upstream response cannot cost every other
 * row its live reading — the whole-list fetch this replaced was all-or-nothing.
 */
async function fetchPoolsById(poolIds: string[]): Promise<Record<string, { apy: number; tvlUsd: number }>> {
  if (poolIds.length === 0) return {};
  const unique = [...new Set(poolIds)];
  const results = await Promise.all(unique.map(fetchPool));

  const byPool: Record<string, { apy: number; tvlUsd: number }> = {};
  unique.forEach((id, i) => {
    const r = results[i];
    if (r) byPool[id] = r;
  });
  return byPool;
}

export const defillamaAdapter: EnrichmentAdapter = {
  source: 'defillama',
  getMetadata(): AdapterMetadata {
    return { source: 'defillama', description: 'Live APY/TVL enrichment, matched by pool ID', kind: 'enrichment' };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return []; // enrichment-only source
  },
  async enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]> {
    const poolIds = opps
      .filter(o => o.status !== 'coming-soon' && o.protocol.metadata.defiLlamaPool)
      .map(o => o.protocol.metadata.defiLlamaPool as string);

    const byPool = await fetchPoolsById(poolIds);

    return opps.map(o => {
      if (o.status === 'coming-soon') return o;
      const id = o.protocol.metadata.defiLlamaPool;
      const live = id ? byPool[id] : null;
      const good = id ? lastKnownGood[id] : undefined;

      if (live && live.apy > 0 && !isAnomalousApy(o.apyRange, live.apy)) {
        if (id) lastKnownGood[id] = { apy: live.apy, tvlUsd: live.tvlUsd };
        return {
          ...o,
          apy: parseFloat(live.apy.toFixed(2)),
          tvlUsd: live.tvlUsd,
          updatedAt: new Date().toISOString(),
          isStale: false,
          scoresEstimated: false,
        };
      }

      // Live reading missing, zero, or rejected as anomalous — fall back to the
      // last accepted live value if we have one, otherwise the seed baseline.
      if (good) {
        return { ...o, apy: good.apy, tvlUsd: good.tvlUsd, isStale: true, scoresEstimated: false };
      }
      return { ...o, isStale: false, scoresEstimated: true };
    });
  },
};

/** Total Stacks DeFi TVL for the dashboard header stat. Fails soft to 0. */
export async function fetchStacksChainTvl(): Promise<number> {
  try {
    const res = await fetch(CHAIN_TVL_URL, { cache: 'no-store', signal: AbortSignal.timeout(TVL_TIMEOUT_MS) });
    if (!res.ok) return 0;
    const json = (await res.json()) as Array<{ date: number; tvl: number }>;
    return json[json.length - 1]?.tvl ?? 0;
  } catch {
    return 0;
  }
}
