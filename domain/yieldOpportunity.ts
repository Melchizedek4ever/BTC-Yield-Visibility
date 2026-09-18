import type { Protocol, IlRisk } from './protocol';
import type { RiskAssessment } from './riskAssessment';
import type { RiskAdjustedYieldScore } from './score';

/**
 * The core entity users evaluate: a single strategy offered by a protocol.
 * One protocol may expose several of these. This is the canonical object every
 * API consumer (frontend, wallets, agents) receives — never raw adapter data.
 */
export interface YieldOpportunity {
  id: string;
  protocolId: string;
  /** Denormalized provider, embedded for single-request consumption. */
  protocol: Protocol;

  strategy: string;
  depositAsset: string;
  rewardAssets: string[];
  earnAsset: string;

  apy: number;
  apyBase: number;
  apyReward: number;
  apyRange: { min: number; max: number };

  tvlUsd: number;
  tvl7dChange: number;
  tvl30dChange: number;
  /**
   * The curated estimate this row started from, kept even when a live reading
   * replaced the figures above, so a consumer can show both and judge whether
   * the estimate still holds. `reviewedAt` dates the estimate, not the reading.
   */
  baseline: { apy: number; tvlUsd: number; reviewedAt: string };

  lockup: string;
  ilRisk: IlRisk;
  minimumDeposit: number | null;

  risk: RiskAssessment;
  score: RiskAdjustedYieldScore;
  healthScore: number;

  status: 'live' | 'coming-soon';
  /**
   * Set when no source publishes a rate for this strategy, holding the reason.
   * A managed strategy such as funding-rate arbitrage has nothing readable on
   * chain and nothing exposed off it, so the honest output is to say so rather
   * than show a curated number the reader cannot check anywhere.
   *
   * The row keeps its TVL and its full risk breakdown — only the rate is
   * missing — and is excluded from the best/safest APY stats.
   */
  unpublishedRate?: string;
  launchTarget?: string;
  capacityNote?: string;
  scoresEstimated?: boolean;
  /** True when a live reading was rejected as anomalous and this is a stale fallback value. */
  isStale?: boolean;
  updatedAt: string;
}
