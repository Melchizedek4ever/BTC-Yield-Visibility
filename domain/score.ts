/**
 * A risk-adjusted yield score that separates organic yield from token
 * emissions, so unsustainable incentive farming isn't rewarded like real yield.
 */
export interface RiskAdjustedYieldScore {
  /** Organic APY (fees / staking rewards), before token incentives. */
  baseYield: number;
  /** APY from token emissions / incentives. */
  incentiveYield: number;
  /** Sustainable yield estimate: baseYield + a discounted share of emissions. */
  realYield: number;
  /** 0–1: share of headline APY that is organic (1 = fully sustainable). */
  sustainability: number;
  /** 0–1: risk drag applied to the score. */
  riskPenalty: number;
  /** Final normalized ranking, 1–10 across the current live set. */
  finalScore: number;
}
