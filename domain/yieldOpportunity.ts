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

  lockup: string;
  ilRisk: IlRisk;
  minimumDeposit: number | null;

  risk: RiskAssessment;
  score: RiskAdjustedYieldScore;
  healthScore: number;

  status: 'live' | 'coming-soon';
  launchTarget?: string;
  capacityNote?: string;
  scoresEstimated?: boolean;
  /** True when a live reading was rejected as anomalous and this is a stale fallback value. */
  isStale?: boolean;
  updatedAt: string;
}
