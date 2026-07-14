import { PROTOCOL_SEED } from '@/lib/protocols';
import type { YieldProtocol } from '@/lib/types';
import type { Protocol } from '@/domain/protocol';
import type { NormalizedOpportunity, ProtocolAdapter, AdapterMetadata } from './types';

/**
 * Origin adapter for the curated seed dataset. Today this supplies every
 * opportunity; as live protocol adapters come online they simply add to the
 * pool the service assembles. This is the reference implementation of the
 * adapter contract — copy its shape for real integrations.
 */

function toProtocol(p: YieldProtocol): Protocol {
  return {
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    slug: p.slug,
    category: p.category,
    icon: p.icon,
    website: p.websiteUrl,
    appUrl: p.appUrl,
    description: p.description,
    protocolAgeMonths: p.protocolAge,
    audited: p.audited,
    audits: p.auditFirms,
    smartContractRisk: p.smartContractRisk,
    supportedAssets: p.supportedAssets,
    metadata: {
      defiLlamaProject: p.defiLlamaProject,
      defiLlamaPool: p.defiLlamaPool,
    },
  };
}

function normalize(p: YieldProtocol): NormalizedOpportunity {
  return {
    id: p.id,
    protocol: toProtocol(p),
    strategy: p.strategy,
    depositAsset: p.supportedAssets[0] ?? p.earnAsset,
    rewardAssets: p.earnAsset.split('+').map(s => s.trim()).filter(Boolean),
    earnAsset: p.earnAsset,
    apy: p.apy,
    apyBase: p.apyBase,
    apyReward: p.apyReward,
    apyRange: p.apyRange,
    tvlUsd: p.tvlUsd,
    tvl7dChange: p.tvl7dChange,
    tvl30dChange: p.tvl30dChange,
    lockup: p.lockupPeriod,
    ilRisk: p.ilRisk,
    minimumDeposit: p.minimumDeposit,
    healthScore: p.healthScore,
    seedRiskScore: p.riskScore,
    status: p.status ?? 'live',
    launchTarget: p.launchTarget,
    capacityNote: p.capacityNote,
    scoresEstimated: p.scoresEstimated,
    updatedAt: p.lastUpdated,
  };
}

export const seedAdapter: ProtocolAdapter = {
  source: 'seed',
  getMetadata(): AdapterMetadata {
    return { source: 'seed', description: 'Curated Stacks yield seed dataset', kind: 'origin' };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    return PROTOCOL_SEED.map(normalize);
  },
};
