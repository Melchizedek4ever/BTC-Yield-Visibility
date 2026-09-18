import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * DATA SOURCE — DefiLlama (Tier 3: cross-protocol aggregator).
 *
 * What it is: the industry-standard DeFi data aggregator. Community-written
 * adapters read each protocol's contracts and DefiLlama republishes the result,
 * so we are one hop from ground truth here — DefiLlama reports on the chain
 * rather than reading it for us on demand.
 *
 * Coverage reality check: DefiLlama tracks ~16,500 pools across all of DeFi and
 * exactly SIX of them are on Stacks, all belonging to Zest. There is no
 * pool-level yield here for ALEX, Bitflow, Velar, StackingDAO, Arkadiko or
 * Hermetica. That is why this adapter is a supplement, not the backbone: the
 * rest of the dashboard has to come from chain reads and protocol-native APIs.
 * See docs/data-sources/40-defillama.md.
 *
 * Matching is strictly by pool ID, never by project name — a project match
 * could stamp an unrelated pool's yield onto a row.
 *
 * Fails soft: on any error or missing match, the opportunity keeps its seed
 * values, flagged `scoresEstimated`.
 */

// Per-pool endpoint, not the full /pools dump. /pools returns every pool
// DefiLlama tracks — 16k rows, ~11MB, well over a minute on a cold fetch —
// to extract the handful we map, and it does not honour a chain filter.
// This form answers in under a kilobyte.
const POOLS_URL = 'https://yields.llama.fi/poolsEnriched';
const CHAIN_TVL_URL = 'https://api.llama.fi/v2/historicalChainTvl/Stacks';
const POOLS_TIMEOUT_MS = 6_000;
const TVL_TIMEOUT_MS = 3_000;

/**
 * One upstream reading. `null` means "no reading" — distinct from a numeric 0,
 * which means "this pool genuinely pays nothing". Collapsing the two is how a
 * 0% pool ends up displayed at its curated 3.5% estimate.
 */
interface LiveReading {
  apy: number | null;
  tvlUsd: number | null;
  /** The pool's own 30-day average — the only thing that can corroborate a 0. */
  apyMean30d: number | null;
}

/** Last APY we accepted for a pool, used when a fresh reading is rejected. */
const lastKnownGood: Record<string, number> = {};

/**
 * Below this, an APY is indistinguishable from nothing. Relative thresholds are
 * useless near zero — everything is "80% below" a positive baseline — so the
 * zero case needs an absolute floor of its own. 0.05% ≈ 5 basis points.
 */
const NEGLIGIBLE_APY = 0.05;

/** A reading this far below its reference is treated as an upstream error. */
const ANOMALY_FLOOR = 0.2;

/**
 * Decides what APY, if any, to take from a reading. Returns null when there is
 * nothing trustworthy to publish.
 *
 * Anomaly detection needs a reference to judge a reading against, and WHICH
 * reference is the whole question. The curated apyRange is a human guess and
 * ranks below live data in the trust hierarchy, so judging live data by it
 * means a stale estimate can veto the truth — which is how Zest's real 0.12%
 * kept losing to a curated 3.5%. The pool's own 30-day mean is the better
 * reference wherever it exists: it is the same source, measured over time.
 *
 * Near zero, relative thresholds stop meaning anything (everything is "80%
 * below" a positive number), so an exact-zero reading is handled separately:
 * publishable when the pool's own history is also negligible, rejected when it
 * contradicts it or when nothing corroborates it at all.
 */
function acceptApy(apyRange: { min: number; max: number }, live: LiveReading): number | null {
  const { apy, apyMean30d } = live;
  if (apy === null) return null;

  if (apy <= NEGLIGIBLE_APY) {
    const corroborated = apyMean30d !== null && apyMean30d <= NEGLIGIBLE_APY;
    return corroborated ? apy : null;
  }

  if (apyMean30d !== null && apyMean30d > 0) {
    return apy < apyMean30d * ANOMALY_FLOOR ? null : apy;
  }

  // No history to judge against — fall back to the curated range.
  const midpoint = (apyRange.min + apyRange.max) / 2;
  return apy < midpoint * ANOMALY_FLOOR ? null : apy;
}

async function fetchPool(poolId: string): Promise<LiveReading | null> {
  try {
    const url = `${POOLS_URL}?pool=${encodeURIComponent(poolId)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(POOLS_TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    const json = (await res.json()) as {
      data?: Array<{ apy: number | null; tvlUsd: number | null; apyMean30d?: number | null }>;
    };
    const row = json.data?.[0];
    if (!row) return null;
    // Nulls preserved deliberately — see LiveReading.
    return { apy: row.apy, tvlUsd: row.tvlUsd, apyMean30d: row.apyMean30d ?? null };
  } catch {
    return null;
  }
}

/**
 * One request per mapped pool, in parallel. A pool that errors or times out
 * drops out on its own, so one bad upstream response cannot cost every other
 * row its live reading — the whole-list fetch this replaced was all-or-nothing.
 */
async function fetchPoolsById(poolIds: string[]): Promise<Record<string, LiveReading>> {
  if (poolIds.length === 0) return {};
  const unique = [...new Set(poolIds)];
  const results = await Promise.all(unique.map(fetchPool));

  const byPool: Record<string, LiveReading> = {};
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
      if (!id) return { ...o, isStale: false, scoresEstimated: true };

      const live = byPool[id];

      // TVL is resolved independently of APY. They are two separate readings,
      // and gating them behind one condition meant a rejected APY silently
      // discarded a perfectly good TVL — which then fed the liquidity risk
      // factor a stale number.
      //
      // The asymmetry with APY is deliberate: a rate of 0 is a normal market
      // state, but a *balance* of 0 for a pool we actively track is far more
      // likely a reporting gap, and there is no 30-day mean to corroborate it.
      const tvlUsd = live && live.tvlUsd !== null && live.tvlUsd > 0 ? live.tvlUsd : o.tvlUsd;

      const accepted = live ? acceptApy(o.apyRange, live) : null;
      if (accepted !== null) {
        const apy = parseFloat(accepted.toFixed(2));
        lastKnownGood[id] = apy;
        return {
          ...o,
          apy,
          tvlUsd,
          updatedAt: new Date().toISOString(),
          isStale: false,
          scoresEstimated: false,
        };
      }

      // No publishable APY — fall back to the last one we accepted if we have
      // it (0 is a valid cached value, hence the explicit undefined check),
      // otherwise the curated seed baseline.
      const good = lastKnownGood[id];
      if (good !== undefined) {
        return { ...o, apy: good, tvlUsd, isStale: true, scoresEstimated: false };
      }
      return { ...o, tvlUsd, isStale: false, scoresEstimated: true };
    });
  },
};

/**
 * Total Stacks DeFi TVL for the dashboard header stat, straight from
 * DefiLlama's chain-level series. Fails soft to 0, which the UI renders as
 * "unavailable" rather than as a real zero.
 */
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
