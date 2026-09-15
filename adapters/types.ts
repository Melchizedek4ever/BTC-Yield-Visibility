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
   * The curated market estimate this row started from, preserved even after a
   * live reading overwrites the fields above. Lets a consumer show both and
   * see when the estimate and reality disagree — and `reviewedAt` says how
   * long ago a human last checked the estimate.
   */
  baseline: { apy: number; tvlUsd: number; reviewedAt: string };

  status: 'live' | 'coming-soon';
  launchTarget?: string;
  capacityNote?: string;
  scoresEstimated?: boolean;
  /** True when a live reading was rejected as anomalous and this is a stale fallback value. */
  isStale?: boolean;
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
