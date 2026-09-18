/**
 * The flat, UI-shaped view of an opportunity — what the current dashboard
 * components read. It is a projection of the domain model (domain/*), produced
 * by the legacy façade in services/yieldService.ts, and deliberately lossy.
 *
 * The canonical model is YieldOpportunity. These types exist so the frontend
 * could stay untouched through the domain refactor; as components migrate to
 * consume YieldOpportunity directly, this file shrinks.
 */

export interface RiskFactorView {
  key: 'smartContract' | 'liquidity' | 'protocolAge' | 'yieldSustainability' | 'impermanentLoss' | 'rewardQuality' | 'counterparty';
  label: string;
  /** 1 (safest) to 10 (riskiest). */
  score: number;
  rationale: string;
}

export interface YieldProtocol {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  description: string;
  category: 'Staking' | 'Lending' | 'DEX/LP' | 'Yield';
  icon: string;
  websiteUrl: string;
  appUrl: string;

  apy: number;
  apyBase: number;
  apyReward: number;
  apyRange: { min: number; max: number };
  earnAsset: string;
  tvlUsd: number;
  tvl7dChange: number;
  tvl30dChange: number;

  riskScore: number;
  healthScore: number;
  opportunityScore: number;

  ilRisk: 'None' | 'Low' | 'Medium' | 'High';
  smartContractRisk: 'Very Low' | 'Low' | 'Medium' | 'High';
  audited: boolean;
  auditFirms: string[];
  protocolAge: number;

  strategy: string;
  lockupPeriod: string;
  minimumDeposit: number | null;
  supportedAssets: string[];

  defiLlamaPool?: string;
  defiLlamaProject?: string;
  /** LP token contract address on Velar's DEX. */
  velarPool?: string;
  lastUpdated: string;

  isStale?: boolean;
  scoresEstimated?: boolean;

  /** Plain-language rationale from the risk engine — why this is scored where it is. */
  riskExplanation?: string;
  /** The risk engine's explainable sub-factors — same data behind riskExplanation, broken out. */
  riskFactors?: RiskFactorView[];

  // Lifecycle. Defaults to 'live' when omitted.
  status?: 'live' | 'coming-soon';
  launchTarget?: string;   // e.g. "Q3 2026" — only for coming-soon sources
  capacityNote?: string;   // short one-liner about program terms
}

export type Category = 'All' | 'Staking' | 'Lending' | 'DEX/LP' | 'Yield';
export type SortKey = 'opportunityScore' | 'apy' | 'riskScore' | 'tvlUsd' | 'healthScore';

export interface GlobalStats {
  totalTvl: number;
  bestApy: number;
  safestApy: number;
  activeSourceCount: number;
  upcomingCount: number;
  /** Live sources currently running on curated estimates rather than a live match. */
  estimatedCount: number;
}
