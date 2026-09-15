import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * Enrichment adapter: overlays live APY/TVL from Velar's DEX onto already-
 * normalized opportunities, matched by LP token contract address (never by
 * protocol name — same collision risk DefiLlama's adapter guards against).
 * Fails soft: on any error, missing pool, or a non-numeric/zero live apy
 * (Velar returns the literal string "--" when a pool has no computed yield),
 * the opportunity keeps its seed values, flagged `scoresEstimated`.
 *
 * No anomaly-rejection/stale-value cache yet, unlike defillamaAdapter — this
 * covers one first-party pool, not an aggregate of many third-party ones;
 * add that guard if Velar's readings turn out to be noisy in practice.
 */

const TIMEOUT_MS = 5_000;

interface VelarPool { stats?: { apy?: number | string; tvl_usd?: { value?: number } } }

function poolUrl(lpToken: string): string {
  return `https://api.velar.co/pools/${lpToken}`;
}

async function fetchPool(lpToken: string): Promise<{ apy: number; tvlUsd: number } | null> {
  try {
    const res = await fetch(poolUrl(lpToken), { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    const json = (await res.json()) as VelarPool;
    const apy = json.stats?.apy;
    if (typeof apy !== 'number' || apy <= 0) return null;
    return { apy, tvlUsd: json.stats?.tvl_usd?.value ?? 0 };
  } catch {
    return null;
  }
}

export const velarAdapter: EnrichmentAdapter = {
  source: 'velar',
  getMetadata(): AdapterMetadata {
    return { source: 'velar', description: "Live APY/TVL enrichment from Velar's DEX, matched by LP token contract", kind: 'enrichment' };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return []; // enrichment-only source
  },
  async enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]> {
    const targets = opps.filter(o => o.status !== 'coming-soon' && o.protocol.metadata.velarPool);
    const fetched = await Promise.all(targets.map(o => fetchPool(o.protocol.metadata.velarPool as string)));
    const liveById = new Map(targets.map((o, i) => [o.id, fetched[i]]));
    const targetIds = new Set(targets.map(o => o.id));

    return opps.map(o => {
      if (!targetIds.has(o.id)) return o; // not this adapter's concern — leave untouched

      const live = liveById.get(o.id);
      if (live) {
        return {
          ...o,
          apy: parseFloat(live.apy.toFixed(2)),
          tvlUsd: live.tvlUsd,
          updatedAt: new Date().toISOString(),
          isStale: false,
          scoresEstimated: false,
        };
      }

      // Fetch failed, pool missing, or apy unusable — keep the seed baseline,
      // but say so explicitly rather than silently reusing whatever flag it had.
      return { ...o, isStale: false, scoresEstimated: true };
    });
  },
};
