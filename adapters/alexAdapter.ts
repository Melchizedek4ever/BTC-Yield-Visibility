import type { EnrichmentAdapter, NormalizedOpportunity, AdapterMetadata } from './types';

/**
 * DATA SOURCE — ALEX public pool API (Tier 2: protocol-native).
 *
 * What it is: ALEX's own read cache over its AMM contracts, covering every
 * pool on the exchange with per-pool balances, 24h/7d volume, fees and APR.
 * It is the richest protocol-native source on Stacks by some margin.
 *
 * What it gives us that an aggregator cannot: `apr_7d` is realized TRADING-FEE
 * yield, computed from actual volume through the pool. That is real yield,
 * cleanly separated from incentive emissions — exactly the split the
 * sustainability risk factor needs and normally has to guess at.
 *
 * FEE YIELD ONLY. ALEX emissions are paid by a separate farming contract this
 * endpoint says nothing about, so `apyReward` stays on its curated estimate
 * and the row stays flagged `scoresEstimated`. Publishing the fee APR as the
 * whole story would rate an emissions-heavy farm as perfectly sustainable —
 * wrong in the opposite direction from overstating it.
 *
 * TVL is NOT claimed. Balances arrive in token units, so valuing a pool means
 * pricing arbitrary SIP-10 tokens (ALEX, wSTX, wsBTC and whatever else a pool
 * holds). That is a price-feed problem, not a pool-data problem, and guessing
 * at it would put an invented dollar figure on the dashboard.
 *
 * ENCODING: every numeric field is an on-chain fixed-point integer scaled by
 * 1e18. `apr_7d: 43582955428507760` is 4.358%, and `fee_rate_x: 5e15` is the
 * pool's 0.5% swap fee — which is what pins the scale. Getting this wrong by
 * a factor of 1e10 is the obvious failure mode, so decoded values are range-
 * checked before they are published.
 */

const POOLS_URL = 'https://api.alexlab.co/v2/public/pools';
// Measured at ~9.6s for the full pool list — the endpoint returns every pool
// on the exchange, and there is no per-pool form. Sized with headroom so a
// normal response is not mistaken for an outage.
const TIMEOUT_MS = 15_000;

/** ALEX's on-chain fixed-point scale. See the ENCODING note above. */
const FIXED_POINT = 1e18;

/**
 * Highest fee APR we will believe. Real AMM fee yield sits in the low tens of
 * percent; anything past this means the fixed-point assumption has broken, and
 * we would rather fall back to a curated estimate than publish a decode error.
 */
const MAX_PLAUSIBLE_APR_PCT = 1_000;

interface AlexPool {
  pool_id?: number;
  apr_7d?: unknown;
}

async function fetchPools(): Promise<Map<number, AlexPool> | null> {
  try {
    const res = await fetch(POOLS_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    // External JSON enters as `unknown` (ts-reset); cast at the boundary.
    const json = (await res.json()) as { data?: AlexPool[] };
    const rows = json.data;
    if (!Array.isArray(rows)) return null;
    return new Map(rows.filter(r => typeof r.pool_id === 'number').map(r => [r.pool_id as number, r]));
  } catch {
    return null;
  }
}

/**
 * Decodes `apr_7d` into a percentage, or null if it cannot be trusted.
 *
 * Zero is a real answer, not a missing one: an empty pool earns no fees, and
 * a reader deserves to see that rather than a curated estimate standing in
 * for an opportunity nobody can actually take.
 */
function decodeFeeApr(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  const pct = (raw / FIXED_POINT) * 100;
  return pct <= MAX_PLAUSIBLE_APR_PCT ? pct : null;
}

export const alexAdapter: EnrichmentAdapter = {
  source: 'alex',
  getMetadata(): AdapterMetadata {
    return {
      source: 'alex',
      description: 'Realized trading-fee APR from ALEX AMM pool state',
      kind: 'enrichment',
    };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return []; // enrichment-only source
  },
  async enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]> {
    const claimed = opps.filter(
      o => o.status !== 'coming-soon' && typeof o.protocol.metadata.alexPoolId === 'number',
    );
    // Nothing mapped: ask for nothing. Keeps a refresh cheap when this source
    // is registered but no row claims it.
    if (claimed.length === 0) return opps;

    const byPoolId = await fetchPools();
    const claimedIds = new Set(claimed.map(o => o.id));

    return opps.map(o => {
      if (!claimedIds.has(o.id)) return o; // not this adapter's concern

      const pool = byPoolId?.get(o.protocol.metadata.alexPoolId as number);
      const feeApr = pool ? decodeFeeApr(pool.apr_7d) : null;
      if (feeApr === null) {
        return { ...o, isStale: false, scoresEstimated: true };
      }

      const apyBase = parseFloat(feeApr.toFixed(2));
      // The emissions half is untouched — see the header. A row with no
      // curated emissions is therefore fully verified; one with them is not,
      // and says so.
      const apy = parseFloat((apyBase + o.apyReward).toFixed(2));

      return {
        ...o,
        apy,
        apyBase,
        updatedAt: new Date().toISOString(),
        isStale: false,
        scoresEstimated: o.apyReward > 0,
      };
    });
  },
};
