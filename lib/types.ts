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
  lastUpdated: string;

  isStale?: boolean;
  scoresEstimated?: boolean;
}

export type Category = 'All' | 'Staking' | 'Lending' | 'DEX/LP' | 'Yield';
export type SortKey = 'opportunityScore' | 'apy' | 'riskScore' | 'tvlUsd' | 'healthScore';

export interface GlobalStats {
  totalTvl: number;
  bestApy: number;
  safestApy: number;
  activeSourceCount: number;
}
