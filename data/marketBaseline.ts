/**
 * Curated market baseline — estimates, not readings.
 *
 * Every figure here is a human estimate standing in for a live source that we
 * either have not wired yet or could not reach this cycle. They are the LAST
 * resort: any live reading overrides them, and rows falling back to these are
 * flagged estimated in the UI.
 *
 * Treat this file as perishable. `reviewedAt` records when a human last
 * checked each row against reality — an old date is a defect, because a stale
 * estimate presented with a confident APY is worse than no figure at all.
 *
 * ── 2026-09-17 review ──────────────────────────────────────────────────────
 * Every row was checked against a live source. The previous figures were not
 * mildly stale; most were wrong by a factor of three to seventy, always in the
 * flattering direction. Recorded here because the size of that drift is the
 * argument for the adapter layer, and because the next reviewer deserves to
 * know what this file looked like when nobody was checking it:
 *
 *   bitflow-sbtc-stx    $5,000,000  →     $68,107   (73x over)
 *   alex-stx-farm       $9,000,000  →    $273,000   (33x over)
 *   alex-sbtc-alex     $12,000,000  →          $0   (pool is empty)
 *   hermetica-hbtc     $45,000,000  →  $5,600,000   (8x over)
 *   granite-btc-supply $26,000,000  →  $6,900,000   (3.8x over)
 *   arkadiko-diko       $3,000,000  →  $1,000,000   (3x over)
 *   zest-btc-supply          3.50%  →      0.00%    (pays nothing)
 *   native-stacking          9.20%  →      5.93%
 *   stackingdao-ststx        8.70%  →      3.39%
 *
 * Each row below says which source its numbers came from and, where a figure
 * could NOT be verified, says that outright rather than letting an unchecked
 * number inherit a fresh review date.
 *
 * ── 2026-09-18 curation ────────────────────────────────────────────────────
 * Three rows removed. `alex-sbtc-alex` described a pool holding no liquidity,
 * so it was not an opportunity anyone could take. `arkadiko-diko` paid DIKO
 * and USDA — no Bitcoin anywhere in it, which fails the product's question
 * before it fails any data check. `dual-stacking` was folded into
 * native-stacking: it is the same locked STX under PoX, so a second row
 * double-counted the pool and carried a TVL nobody publishes.
 */
export interface MarketBaseline {
  protocolId: string;
  apy: number;
  apyBase: number;
  apyReward: number;
  apyRange: { min: number; max: number };
  tvlUsd: number;
  tvl7dChange: number;
  tvl30dChange: number;
  /** ISO date a human last verified this estimate against the source. */
  reviewedAt: string;
}

export const MARKET_BASELINE: MarketBaseline[] = [
  {
    // Pre-launch. These are published launch targets, not estimates of a
    // market that exists — nothing to verify against yet.
    protocolId: "bitcoin-staking",
    apy: 3,
    apyBase: 3,
    apyReward: 0,
    apyRange: { min: 3, max: 5 },
    tvlUsd: 0,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-08-21",
  },
  {
    // Verified against PoX chain state and StackingDAO's published rate:
    // cycle 143, 441,576,024 STX stacked at $0.2491 = ~$110.0M, paying 5.93%.
    // Both figures now come from adapters; this is the fallback if they fail.
    protocolId: "native-stacking",
    apy: 5.93,
    apyBase: 5.93,
    apyReward: 0,
    apyRange: { min: 4, max: 9 },
    tvlUsd: 110000000,
    tvl7dChange: 1.1,
    tvl30dChange: 5.2,
    reviewedAt: "2026-09-17",
  },
  {
    // TVL verified against DefiLlama ($5.57M). The rate is declared unpublished
    // in the registry, so these are placeholders rather than estimates — the
    // row renders a disclosure instead of a number and is excluded from the
    // APY stats. The previous 12.5% was an unchecked carry-over with nothing
    // behind it; zeroing it is what stops it leaking into scoring.
    protocolId: "hermetica-hbtc",
    apy: 0,
    apyBase: 0,
    apyReward: 0,
    apyRange: { min: 0, max: 0 },
    tvlUsd: 5600000,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-17",
  },
  {
    // APY from StackingDAO's own stats endpoint (adapter-fed).
    //
    // TVL corrected down from $31.0M. That figure was the protocol total,
    // which also contains stBTC. DefiLlama's per-token breakdown splits
    // StackingDAO into $22.0M STX and $11.9M sBTC; this row is part of the STX
    // bucket, shared with stSTXbtc. Both take a conservative share summing
    // below the bucket rather than either claiming it whole.
    protocolId: "stackingdao-ststx",
    apy: 3.39,
    apyBase: 3.39,
    apyReward: 0,
    apyRange: { min: 2, max: 8 },
    tvlUsd: 20000000,
    tvl7dChange: 0.8,
    tvl30dChange: 3.1,
    reviewedAt: "2026-09-17",
  },
  {
    // APY live from StackingDAO (2.69%, confirmed against the figure their own
    // app displays). TVL measured: DefiLlama's per-token breakdown of
    // StackingDAO splits $33.9M into $22.0M STX and $11.9M sBTC, and the sBTC
    // bucket is this product.
    protocolId: "stackingdao-stbtc",
    apy: 2.69,
    apyBase: 2.69,
    apyReward: 0,
    apyRange: { min: 1, max: 6 },
    tvlUsd: 11933292,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-18",
  },
  {
    // APY live from StackingDAO (apy_ststxbtc, 3.54%).
    //
    // TWO CAVEATS, both needing confirmation with the team:
    //  1. Their marketing page headlines stSTXbtc at a figure equal to
    //     apy_native, not apy_ststxbtc. The field name is explicit and the
    //     stBTC key checked out exactly against their own display, so the API
    //     field is taken as authoritative — but it is not independently proven.
    //  2. TVL is NOT measured. The $22.0M STX bucket covers stSTX and stSTXbtc
    //     together and no source splits it. Where a measured bucket covers two
    //     rows and the split is unknown, both rows take a conservative share
    //     that deliberately sums BELOW the bucket: understating liquidity
    //     raises the liquidity risk score, which errs against the opportunity
    //     rather than in its favour.
    protocolId: "stackingdao-ststxbtc",
    apy: 3.54,
    apyBase: 3.54,
    apyReward: 0,
    apyRange: { min: 1, max: 7 },
    tvlUsd: 2000000,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-18",
  },
  {
    // DefiLlama reports this pool paying 0% with ~190 observations and a
    // 30-day mean of 0.007%. This file previously carried 3.5% — the case that
    // prompted the zero-vs-missing fix in defillamaAdapter. TVL $50.6M.
    protocolId: "zest-btc-supply",
    apy: 0,
    apyBase: 0,
    apyReward: 0,
    apyRange: { min: 0, max: 5 },
    tvlUsd: 50600000,
    tvl7dChange: 2.2,
    tvl30dChange: 9.8,
    reviewedAt: "2026-09-17",
  },
  {
    // Measured from DefiLlama's Zest stSTXbtc pool: $2,175,623 TVL paying 0%,
    // with a 30-day mean of 0. Both figures are adapter-fed; these are the
    // fallback. A lending market paying nothing is worth showing as such.
    protocolId: "zest-ststxbtc-supply",
    apy: 0,
    apyBase: 0,
    apyReward: 0,
    apyRange: { min: 0, max: 5 },
    tvlUsd: 2175623,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-18",
  },
  {
    // TVL verified against DefiLlama ($6.86M) — note the slug is `granite`,
    // not `granite-protocol`, which resolves to nothing. APY NOT VERIFIED:
    // Granite exposes no public market endpoint, and the supply rate has to be
    // read from the reserve contract. 4.8% is an unchecked carry-over.
    protocolId: "granite-btc-supply",
    apy: 4.8,
    apyBase: 4.8,
    apyReward: 0,
    apyRange: { min: 1, max: 6 },
    tvlUsd: 6900000,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-17",
  },
  {
    // Verified against Bitflow's ticker: $68,107 liquidity and $0 of 24-hour
    // volume. No volume means no trading fees, so the fee component is 0 —
    // that is a measurement, not a guess. No incentive program is evidenced
    // either, so the previous 14.2% (6 base + 8.2 reward) had nothing behind
    // it. TVL is now adapter-fed; this is the fallback.
    protocolId: "bitflow-sbtc-stx",
    apy: 0,
    apyBase: 0,
    apyReward: 0,
    apyRange: { min: 0, max: 8 },
    tvlUsd: 68107,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-17",
  },
  {
    // Measured from Bitflow's ticker: $141,180 liquidity and $0 of 24-hour
    // volume. No volume means no trading fees, so the fee yield is genuinely
    // zero — a measurement, not an estimate. This is the larger of Bitflow's
    // two sBTC pools. TVL is adapter-fed; this is the fallback.
    protocolId: "bitflow-sbtc-pbtc",
    apy: 0,
    apyBase: 0,
    apyReward: 0,
    apyRange: { min: 0, max: 6 },
    tvlUsd: 141180,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-18",
  },
  {
    // Live from Velar's pool API (1.07% APY, $104,309 TVL).
    protocolId: "velar-sbtc",
    apy: 1.07,
    apyBase: 1.07,
    apyReward: 0,
    apyRange: { min: 0.5, max: 3 },
    tvlUsd: 104309,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-17",
  },
  {
    // ALEX pool 13 (STX/ALEX): 7-day trading-fee APR 4.36%, holding 535,133
    // STX + 43,164,575 ALEX ≈ $273,000. The previous 45% was attributed almost
    // entirely to emissions (40 of 45 points); no active emissions program is
    // evidenced on this pool, so that component is dropped rather than carried
    // forward unverified. Understating a fee yield a reader can check beats
    // publishing an incentive rate nobody can.
    protocolId: "alex-stx-farm",
    apy: 4.36,
    apyBase: 4.36,
    apyReward: 0,
    apyRange: { min: 1, max: 20 },
    tvlUsd: 273000,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-09-17",
  },
];
