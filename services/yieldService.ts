import { seedAdapter } from '@/adapters/seedAdapter';
import { alexAdapter } from '@/adapters/alexAdapter';
import { defillamaAdapter, fetchStacksChainTvl } from '@/adapters/defillamaAdapter';
import { assessRisk } from '@/lib/riskEngine';
import { buildScores } from '@/lib/scoringEngine';
import type { NormalizedOpportunity, ProtocolAdapter, EnrichmentAdapter } from '@/adapters/types';
import type { RiskAssessment } from '@/domain/riskAssessment';
import type { RiskAdjustedYieldScore } from '@/domain/score';
import type { YieldOpportunity } from '@/domain/yieldOpportunity';
import type { YieldProtocol, GlobalStats } from '@/lib/types';

/**
 * Yield Intelligence Service — the single orchestration point between the API
 * layer and the domain engines. API routes call this and nothing else; all
 * fetching, normalization, risk assessment, scoring, and caching live here.
 *
 * Pipeline:  origin adapters → enrichment adapters → risk engine → scoring
 *            engine → YieldOpportunity[]  (then a legacy view for the dashboard)
 */

// Register data sources here. Adding a protocol = add its adapter to this list.
const ORIGIN_ADAPTERS: ProtocolAdapter[] = [seedAdapter, alexAdapter];
const ENRICHMENT_ADAPTERS: EnrichmentAdapter[] = [defillamaAdapter];

const CACHE_TTL = 60_000;
let cache: { opportunities: YieldOpportunity[]; chainTvl: number; ts: number } | null = null;

function toOpportunity(
  o: NormalizedOpportunity,
  risk: RiskAssessment,
  score: RiskAdjustedYieldScore
): YieldOpportunity {
  return {
    id: o.id,
    protocolId: o.protocol.id,
    protocol: o.protocol,
    strategy: o.strategy,
    depositAsset: o.depositAsset,
    rewardAssets: o.rewardAssets,
    earnAsset: o.earnAsset,
    apy: o.apy,
    apyBase: o.apyBase,
    apyReward: o.apyReward,
    apyRange: o.apyRange,
    tvlUsd: o.tvlUsd,
    tvl7dChange: o.tvl7dChange,
    tvl30dChange: o.tvl30dChange,
    lockup: o.lockup,
    ilRisk: o.ilRisk,
    minimumDeposit: o.minimumDeposit,
    risk,
    score,
    healthScore: o.healthScore,
    status: o.status,
    launchTarget: o.launchTarget,
    capacityNote: o.capacityNote,
    scoresEstimated: o.scoresEstimated,
    updatedAt: o.updatedAt,
  };
}

async function assemble(): Promise<{ opportunities: YieldOpportunity[]; chainTvl: number }> {
  // 1. Gather normalized opportunities from every origin adapter.
  const gathered = await Promise.all(ORIGIN_ADAPTERS.map(a => a.fetchOpportunities().catch(() => [])));
  let normalized: NormalizedOpportunity[] = gathered.flat();

  // 2. Enrich with live data (each enrichment adapter refines in turn).
  for (const enricher of ENRICHMENT_ADAPTERS) {
    normalized = await enricher.enrich(normalized);
  }

  // 3. Risk assessment (explainable sub-factors).
  const risks = new Map<string, RiskAssessment>(normalized.map(o => [o.id, assessRisk(o)]));

  // 4. Risk-adjusted scoring (normalized across the live set).
  const scores = buildScores(normalized, risks);

  // 5. Compose canonical domain objects.
  const opportunities = normalized.map(o => toOpportunity(o, risks.get(o.id)!, scores.get(o.id)!));

  const chainTvl = await fetchStacksChainTvl();
  return { opportunities, chainTvl };
}

async function getCached() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL) return cache;
  const { opportunities, chainTvl } = await assemble();
  cache = { opportunities, chainTvl, ts: now };
  return cache;
}

/** Canonical, consumer-agnostic model — for /api/v1 and any future SDK. */
export async function getOpportunities(): Promise<YieldOpportunity[]> {
  return (await getCached()).opportunities;
}

// ── Legacy dashboard façade ────────────────────────────────────────────────
// Maps the rich domain model back to the flat shape the current frontend reads,
// so the UI is untouched by this refactor. When the frontend migrates to consume
// YieldOpportunity directly, this façade can be deleted.

function toLegacy(o: YieldOpportunity): YieldProtocol {
  return {
    id: o.id,
    name: o.protocol.name,
    shortName: o.protocol.shortName,
    slug: o.protocol.slug,
    description: o.protocol.description,
    category: o.protocol.category,
    icon: o.protocol.icon,
    websiteUrl: o.protocol.website,
    appUrl: o.protocol.appUrl,
    apy: o.apy,
    apyBase: o.apyBase,
    apyReward: o.apyReward,
    apyRange: o.apyRange,
    earnAsset: o.earnAsset,
    tvlUsd: o.tvlUsd,
    tvl7dChange: o.tvl7dChange,
    tvl30dChange: o.tvl30dChange,
    riskScore: o.risk.overallScore,
    healthScore: o.healthScore,
    opportunityScore: o.score.finalScore,
    ilRisk: o.ilRisk,
    smartContractRisk: o.protocol.smartContractRisk,
    audited: o.protocol.audited,
    auditFirms: o.protocol.audits,
    protocolAge: o.protocol.protocolAgeMonths,
    strategy: o.strategy,
    lockupPeriod: o.lockup,
    minimumDeposit: o.minimumDeposit,
    supportedAssets: o.protocol.supportedAssets,
    defiLlamaProject: o.protocol.metadata.defiLlamaProject,
    defiLlamaPool: o.protocol.metadata.defiLlamaPool,
    lastUpdated: o.updatedAt,
    scoresEstimated: o.scoresEstimated,
    status: o.status,
    launchTarget: o.launchTarget,
    capacityNote: o.capacityNote,
  };
}

function buildStats(opps: YieldOpportunity[], chainTvl: number): GlobalStats {
  const live = opps.filter(o => o.status !== 'coming-soon');
  return {
    totalTvl: chainTvl || live.reduce((s, o) => s + o.tvlUsd, 0),
    bestApy: Math.max(...live.map(o => o.apy), 0),
    safestApy: Math.max(...live.filter(o => o.risk.overallScore <= 3).map(o => o.apy), 0),
    activeSourceCount: live.length,
    upcomingCount: opps.length - live.length,
  };
}

export async function getDashboard(): Promise<{ protocols: YieldProtocol[]; stats: GlobalStats }> {
  const { opportunities, chainTvl } = await getCached();
  return { protocols: opportunities.map(toLegacy), stats: buildStats(opportunities, chainTvl) };
}
