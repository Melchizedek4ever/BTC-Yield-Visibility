import { seedAdapter } from '@/adapters/seedAdapter';
import { alexAdapter } from '@/adapters/alexAdapter';
import { defillamaAdapter, fetchStacksChainTvl } from '@/adapters/defillamaAdapter';
import { velarAdapter } from '@/adapters/velarAdapter';
import { hiroPoxAdapter } from '@/adapters/hiroPoxAdapter';
import { assessRisk } from '@/lib/riskEngine';
import { buildScores } from '@/lib/scoringEngine';
import type { NormalizedOpportunity, ProtocolAdapter, EnrichmentAdapter } from '@/adapters/types';
import type { RiskAssessment } from '@/domain/riskAssessment';
import type { RiskAdjustedYieldScore } from '@/domain/score';
import type { YieldOpportunity } from '@/domain/yieldOpportunity';
import type { YieldProtocol, GlobalStats, RiskFactorView } from '@/lib/types';

/**
 * Yield Intelligence Service — the single orchestration point between the API
 * layer and the domain engines. API routes call this and nothing else; all
 * fetching, normalization, risk assessment, scoring, and caching live here.
 *
 * Pipeline:  origin adapters → enrichment adapters → risk engine → scoring
 *            engine → YieldOpportunity[]  (then a legacy view for the dashboard)
 */

/**
 * Everything the service reaches outside itself. Declared as data rather than
 * imported at the point of use, so the whole pipeline can be driven with
 * controlled inputs — including the clock, which makes cache expiry testable
 * without mutating global timers.
 */
export interface YieldServiceDeps {
  originAdapters: ProtocolAdapter[];
  enrichmentAdapters: EnrichmentAdapter[];
  chainTvlSource: () => Promise<number>;
  now: () => number;
  cacheTtlMs: number;
}

export const defaultDeps: YieldServiceDeps = {
  // Register data sources here. Adding a protocol = add its adapter to this list.
  originAdapters: [seedAdapter, alexAdapter],
  // Order matters: each enricher overlays the previous one's output, so the
  // list runs from least to most authoritative. DefiLlama is the broad
  // third-party baseline; protocol-native sources like Velar override it for
  // pools both cover; chain state last, since a figure read straight off the
  // chain beats anyone's reporting of it.
  enrichmentAdapters: [defillamaAdapter, velarAdapter, hiroPoxAdapter],
  chainTvlSource: fetchStacksChainTvl,
  now: Date.now,
  cacheTtlMs: 60_000,
};

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
    baseline: o.baseline,
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
    isStale: o.isStale,
    updatedAt: o.updatedAt,
  };
}

// ── Legacy dashboard façade ────────────────────────────────────────────────
// Maps the rich domain model back to the flat shape the current frontend reads,
// so the UI is untouched by this refactor. When the frontend migrates to consume
// YieldOpportunity directly, this façade can be deleted.

function toRiskFactors(o: YieldOpportunity): RiskFactorView[] {
  const r = o.risk;
  return [
    { key: 'smartContract', label: 'Smart Contract', score: r.smartContractRisk.score, rationale: r.smartContractRisk.rationale },
    { key: 'liquidity', label: 'Liquidity', score: r.liquidityRisk.score, rationale: r.liquidityRisk.rationale },
    { key: 'protocolAge', label: 'Protocol Age', score: r.protocolAgeRisk.score, rationale: r.protocolAgeRisk.rationale },
    { key: 'yieldSustainability', label: 'Yield Sustainability', score: r.yieldSustainabilityRisk.score, rationale: r.yieldSustainabilityRisk.rationale },
    { key: 'impermanentLoss', label: 'Impermanent Loss', score: r.impermanentLossRisk.score, rationale: r.impermanentLossRisk.rationale },
    { key: 'rewardQuality', label: 'Reward Quality', score: r.rewardQualityRisk.score, rationale: r.rewardQualityRisk.rationale },
    { key: 'counterparty', label: 'Counterparty', score: r.counterpartyRisk.score, rationale: r.counterpartyRisk.rationale },
  ];
}

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
    isStale: o.isStale,
    riskExplanation: o.risk.explanation,
    riskFactors: o.status === 'coming-soon' ? undefined : toRiskFactors(o),
    status: o.status,
    launchTarget: o.launchTarget,
    capacityNote: o.capacityNote,
  };
}

function buildStats(opps: YieldOpportunity[], chainTvl: number): GlobalStats {
  const live = opps.filter(o => o.status !== 'coming-soon');
  return {
    // DefiLlama's chain-wide DeFi TVL, reported as-is. Summing our own rows
    // measures something else — they include consensus-level stacking that
    // chain DeFi TVL excludes — so there is no honest fallback here: 0 means
    // the upstream figure is unavailable, and the UI says so.
    totalTvl: chainTvl,
    bestApy: Math.max(...live.map(o => o.apy), 0),
    safestApy: Math.max(...live.filter(o => o.risk.overallScore <= 3).map(o => o.apy), 0),
    activeSourceCount: live.length,
    upcomingCount: opps.length - live.length,
    estimatedCount: live.filter(o => o.scoresEstimated).length,
  };
}

export interface YieldService {
  /** Canonical, consumer-agnostic model — for /api/v1 and any future SDK. */
  getOpportunities(): Promise<YieldOpportunity[]>;
  getDashboard(): Promise<{ protocols: YieldProtocol[]; stats: GlobalStats }>;
}

/**
 * Builds a service over the given dependencies, defaulting to the live ones.
 * The cache is closure state rather than module state, so every instance starts
 * cold: tests cannot leak assembled results into one another, and no test-only
 * reset hatch has to exist in production code.
 */
export function createYieldService(overrides: Partial<YieldServiceDeps> = {}): YieldService {
  const deps = { ...defaultDeps, ...overrides };
  let cache: { opportunities: YieldOpportunity[]; chainTvl: number; ts: number } | null = null;

  async function assemble(): Promise<{ opportunities: YieldOpportunity[]; chainTvl: number }> {
    // 1. Gather normalized opportunities from every origin adapter. A source
    //    that throws is skipped rather than failing the whole refresh.
    const gathered = await Promise.all(deps.originAdapters.map(a => a.fetchOpportunities().catch(() => [])));
    let normalized: NormalizedOpportunity[] = gathered.flat();

    // 2. Enrich with live data (each enrichment adapter refines in turn). A
    //    throwing enricher is skipped like a failing origin source: losing one
    //    live overlay degrades the reading, it must never fail the refresh and
    //    take the dashboard down with it. Rows keep whatever the previous stage
    //    produced — no flags are invented, since we cannot know which rows this
    //    enricher would have claimed.
    for (const enricher of deps.enrichmentAdapters) {
      try {
        normalized = await enricher.enrich(normalized);
      } catch {
        // Skip this overlay and continue with the remaining enrichers.
      }
    }

    // 3. Risk assessment (explainable sub-factors).
    const risks = new Map<string, RiskAssessment>(normalized.map(o => [o.id, assessRisk(o)]));

    // 4. Risk-adjusted scoring (normalized across the live set).
    const scores = buildScores(normalized, risks);

    // 5. Compose canonical domain objects.
    const opportunities = normalized.map(o => toOpportunity(o, risks.get(o.id)!, scores.get(o.id)!));

    // A header statistic is never worth failing the refresh for: 0 makes
    // buildStats fall back to the summed opportunity TVL.
    const chainTvl = await deps.chainTvlSource().catch(() => 0);
    return { opportunities, chainTvl };
  }

  async function getCached() {
    const now = deps.now();
    if (cache && now - cache.ts < deps.cacheTtlMs) return cache;
    const { opportunities, chainTvl } = await assemble();
    cache = { opportunities, chainTvl, ts: now };
    return cache;
  }

  return {
    async getOpportunities() {
      return (await getCached()).opportunities;
    },
    async getDashboard() {
      const { opportunities, chainTvl } = await getCached();
      return { protocols: opportunities.map(toLegacy), stats: buildStats(opportunities, chainTvl) };
    },
  };
}

/**
 * The instance the application runs on. Created at import time so its cache is
 * process-global, which is what the API routes want. Routes keep importing the
 * two functions directly, so the seam is invisible to them.
 */
export const yieldService = createYieldService();

export const getOpportunities = (): Promise<YieldOpportunity[]> => yieldService.getOpportunities();

export const getDashboard = (): Promise<{ protocols: YieldProtocol[]; stats: GlobalStats }> =>
  yieldService.getDashboard();
