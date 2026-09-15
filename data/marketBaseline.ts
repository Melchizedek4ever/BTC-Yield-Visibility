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
 * Zest is the cautionary case: this file long carried 3.5% for a pool that
 * DefiLlama reports paying 0%.
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
    protocolId: "dual-stacking",
    apy: 10,
    apyBase: 10,
    apyReward: 0,
    apyRange: { min: 7, max: 10 },
    tvlUsd: 100000000,
    tvl7dChange: 3.2,
    tvl30dChange: 12.4,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "native-stacking",
    apy: 9.2,
    apyBase: 9.2,
    apyReward: 0,
    apyRange: { min: 7, max: 11 },
    // Reviewed against PoX chain state (cycle 143: 441.6M STX stacked, which
    // at the then-current STX price is ~$114.7M). The previous $200,000,000
    // was high by roughly three quarters. Rounded deliberately: this is the
    // fallback for when the live reading cannot be fetched, not a measurement.
    tvlUsd: 115000000,
    tvl7dChange: 1.1,
    tvl30dChange: 5.2,
    reviewedAt: "2026-09-15",
  },
  {
    protocolId: "hermetica-hbtc",
    apy: 12.5,
    apyBase: 3.5,
    apyReward: 9,
    apyRange: { min: 8, max: 16 },
    tvlUsd: 45000000,
    tvl7dChange: 4.1,
    tvl30dChange: 18.3,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "stackingdao-ststx",
    apy: 8.7,
    apyBase: 8.7,
    apyReward: 0,
    apyRange: { min: 7, max: 10 },
    tvlUsd: 20000000,
    tvl7dChange: 0.8,
    tvl30dChange: 3.1,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "zest-btc-supply",
    apy: 3.5,
    apyBase: 3.5,
    apyReward: 0,
    apyRange: { min: 2, max: 5 },
    tvlUsd: 75900000,
    tvl7dChange: 2.2,
    tvl30dChange: 9.8,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "granite-btc-supply",
    apy: 4.8,
    apyBase: 4.8,
    apyReward: 0,
    apyRange: { min: 3, max: 6 },
    tvlUsd: 26000000,
    tvl7dChange: 1.5,
    tvl30dChange: 7.2,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "bitflow-sbtc-stx",
    apy: 14.2,
    apyBase: 6,
    apyReward: 8.2,
    apyRange: { min: 8, max: 22 },
    tvlUsd: 5000000,
    tvl7dChange: 3.5,
    tvl30dChange: 14,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "alex-sbtc-alex",
    apy: 22.4,
    apyBase: 4,
    apyReward: 18.4,
    apyRange: { min: 12, max: 35 },
    tvlUsd: 12000000,
    tvl7dChange: 2.1,
    tvl30dChange: 5.5,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "velar-sbtc",
    apy: 1.26,
    apyBase: 1.26,
    apyReward: 0,
    apyRange: { min: 0.5, max: 3 },
    tvlUsd: 86516,
    tvl7dChange: 0,
    tvl30dChange: 0,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "alex-stx-farm",
    apy: 45,
    apyBase: 5,
    apyReward: 40,
    apyRange: { min: 20, max: 60 },
    tvlUsd: 9000000,
    tvl7dChange: -1.2,
    tvl30dChange: 2.1,
    reviewedAt: "2026-08-21",
  },
  {
    protocolId: "arkadiko-diko",
    apy: 11.2,
    apyBase: 11.2,
    apyReward: 0,
    apyRange: { min: 8, max: 15 },
    tvlUsd: 3000000,
    tvl7dChange: 0.5,
    tvl30dChange: -2.1,
    reviewedAt: "2026-08-21",
  },
];
