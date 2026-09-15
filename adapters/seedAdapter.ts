import { PROTOCOL_REGISTRY } from '@/data/protocolRegistry';
import { MARKET_BASELINE } from '@/data/marketBaseline';
import type { ProtocolRecord } from '@/data/protocolRegistry';
import type { MarketBaseline } from '@/data/marketBaseline';
import type { Protocol } from '@/domain/protocol';
import type { NormalizedOpportunity, ProtocolAdapter, AdapterMetadata } from './types';

/**
 * Origin adapter for the curated dataset. It joins two deliberately separate
 * inputs:
 *
 *   protocolRegistry  durable judgement — audits, contract complexity, IL
 *                     exposure, category. No API supplies these.
 *   marketBaseline    perishable estimates — APY and TVL, superseded by any
 *                     live reading an enrichment adapter can get.
 *
 * They were one file, which let a months-old APY estimate sit beside an audit
 * assessment looking equally authoritative. Splitting them makes the
 * perishable half visible as perishable, and gives the registry — the part
 * competitors cannot scrape — a home of its own.
 *
 * This is the reference implementation of the adapter contract; copy its shape
 * for real integrations.
 */

function toProtocol(r: ProtocolRecord): Protocol {
  return {
    id: r.id,
    name: r.name,
    shortName: r.shortName,
    slug: r.slug,
    category: r.category,
    icon: r.icon,
    website: r.website,
    appUrl: r.appUrl,
    description: r.description,
    protocolAgeMonths: r.protocolAgeMonths,
    audited: r.audited,
    audits: r.audits,
    smartContractRisk: r.smartContractRisk,
    supportedAssets: r.supportedAssets,
    metadata: {
      defiLlamaProject: r.externalIds.defiLlamaProject,
      defiLlamaPool: r.externalIds.defiLlamaPool,
      velarPool: r.externalIds.velarPool,
      stacksPox: r.externalIds.stacksPox,
    },
  };
}

function normalize(r: ProtocolRecord, m: MarketBaseline): NormalizedOpportunity {
  return {
    id: r.id,
    protocol: toProtocol(r),
    strategy: r.strategy,
    depositAsset: r.supportedAssets[0] ?? r.earnAsset,
    rewardAssets: r.earnAsset.split('+').map(s => s.trim()).filter(Boolean),
    earnAsset: r.earnAsset,

    apy: m.apy,
    apyBase: m.apyBase,
    apyReward: m.apyReward,
    apyRange: m.apyRange,
    tvlUsd: m.tvlUsd,
    tvl7dChange: m.tvl7dChange,
    tvl30dChange: m.tvl30dChange,

    // Carried alongside whatever a live source later overwrites above, so a
    // consumer can show both and see when the estimate and reality disagree.
    baseline: { apy: m.apy, tvlUsd: m.tvlUsd, reviewedAt: m.reviewedAt },

    lockup: r.lockup,
    ilRisk: r.ilRisk,
    minimumDeposit: r.minimumDeposit,
    healthScore: r.healthScore,
    status: r.status,
    launchTarget: r.launchTarget,
    capacityNote: r.capacityNote,
    // Live rows start as estimates and an enrichment adapter clears the flag
    // when it lands a real reading. Coming-soon rows are left unflagged: their
    // figures are published launch targets, already labelled as such, and no
    // enrichment source will ever claim them.
    scoresEstimated: r.status === 'live' ? true : undefined,
    // Stamped fresh on every fetch (not a static literal) so the header's
    // "updated Xs ago" reflects when this refresh cycle actually ran.
    updatedAt: new Date().toISOString(),
  };
}

export const seedAdapter: ProtocolAdapter = {
  source: 'seed',
  getMetadata(): AdapterMetadata {
    return { source: 'seed', description: 'Curated Stacks protocol registry and market baseline', kind: 'origin' };
  },
  async fetchOpportunities(): Promise<NormalizedOpportunity[]> {
    const baselineById = new Map(MARKET_BASELINE.map(m => [m.protocolId, m]));

    // A registry entry with no baseline is a data-integrity gap, not a runtime
    // error: skip the row rather than emit an opportunity with no market
    // figures at all, and let the missing row show up as reduced coverage.
    return PROTOCOL_REGISTRY.map(r => {
      const m = baselineById.get(r.id);
      return m ? normalize(r, m) : null;
    }).filter(o => o !== null);
  },
};
