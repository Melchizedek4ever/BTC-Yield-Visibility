import type { Protocol, IlRisk } from '@/domain/protocol';

/**
 * A source-agnostic opportunity AFTER an adapter has normalized its external
 * shape, but BEFORE the risk engine and scoring engine run. This is the unified
 * internal format — nothing downstream should ever see a raw protocol payload.
 */
export interface NormalizedOpportunity {
  id: string;
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

  healthScore: number;
  /**
   * Curated overall risk (1–10). Authoritative today; the risk engine decomposes
   * it into explainable sub-factors. When adapters supply full raw signals, the
   * engine can compute the overall itself and this field goes away.
   */
  seedRiskScore: number;

  status: 'live' | 'coming-soon';
  launchTarget?: string;
  capacityNote?: string;
  scoresEstimated?: boolean;
  updatedAt: string;
}

export interface AdapterMetadata {
  source: string;
  description: string;
  /** 'origin' adapters emit opportunities; 'enrichment' adapters refine them. */
  kind: 'origin' | 'enrichment';
}

/**
 * Every data source implements this. The rest of the app never knows where an
 * opportunity came from. Adding a protocol = add an adapter, nothing else.
 */
export interface ProtocolAdapter {
  readonly source: string;
  getMetadata(): AdapterMetadata;
  /** Origin adapters return opportunities; enrichment adapters return []. */
  fetchOpportunities(): Promise<NormalizedOpportunity[]>;
}

/** Enrichment adapters refine live fields (APY, TVL) on already-normalized opps. */
export interface EnrichmentAdapter extends ProtocolAdapter {
  enrich(opps: NormalizedOpportunity[]): Promise<NormalizedOpportunity[]>;
}
