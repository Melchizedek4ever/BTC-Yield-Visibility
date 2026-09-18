import { seedAdapter } from '@/adapters/seedAdapter';
import { alexAdapter } from '@/adapters/alexAdapter';
import { defillamaAdapter, fetchStacksChainTvl } from '@/adapters/defillamaAdapter';
import { velarAdapter } from '@/adapters/velarAdapter';
import { bitflowAdapter } from '@/adapters/bitflowAdapter';
import { hiroPoxAdapter } from '@/adapters/hiroPoxAdapter';
import { stackingDaoAdapter } from '@/adapters/stackingDaoAdapter';
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
  /**
   * Where refresh telemetry goes. Injected rather than imported so tests can
   * capture records without a module-level sink and a test-only reset hatch.
   */
  log: LogSink;
}

/** One structured telemetry record. `event` names it; the rest is context. */
export type LogRecord = Record<string, unknown> & { event: string };
export type LogSink = (record: LogRecord) => void;

/**
 * Default sink: one JSON line per record on stdout, which is what every
 * hosting platform already collects. Deliberately not a logging library —
 * there is nothing here a dependency would do better yet.
 */
const consoleSink: LogSink = record => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...record }));
};

export const defaultDeps: YieldServiceDeps = {
  // Register data sources here. Adding a protocol = add its adapter to this list.
  originAdapters: [seedAdapter],
  // Order matters: each enricher overlays the previous one's output, so the
  // list runs from least to most authoritative. DefiLlama is the broad
  // third-party baseline; protocol-native sources like Velar override it for
  // pools both cover; chain state last, since a figure read straight off the
  // chain beats anyone's reporting of it.
  enrichmentAdapters: [
    defillamaAdapter,
    alexAdapter,
    bitflowAdapter,
    velarAdapter,
    stackingDaoAdapter,
    hiroPoxAdapter,
  ],
  chainTvlSource: fetchStacksChainTvl,
  log: consoleSink,
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
    unpublishedRate: o.unpublishedRate,
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
    unpublishedRate: o.unpublishedRate,
  };
}

function buildStats(opps: YieldOpportunity[], chainTvl: number): GlobalStats {
  const live = opps.filter(o => o.status !== 'coming-soon');
  // A strategy whose rate nobody publishes carries apy 0, which is a placeholder
  // rather than a reading. Including it would drag the headline down with a
  // number that is not a rate, so the APY stats are taken over rated rows only.
  const rated = live.filter(o => !o.unpublishedRate);
  return {
    // DefiLlama's chain-wide DeFi TVL, reported as-is. Summing our own rows
    // measures something else — they include consensus-level stacking that
    // chain DeFi TVL excludes — so there is no honest fallback here: 0 means
    // the upstream figure is unavailable, and the UI says so.
    totalTvl: chainTvl,
    bestApy: Math.max(...rated.map(o => o.apy), 0),
    safestApy: Math.max(...rated.filter(o => o.risk.overallScore <= 3).map(o => o.apy), 0),
    activeSourceCount: live.length,
    upcomingCount: opps.length - live.length,
    estimatedCount: live.filter(o => o.scoresEstimated).length,
  };
}

/**
 * Folds concurrent enrichment results back into one list.
 *
 * Two rules, and the second is the one that is easy to get wrong.
 *
 * WHICH ROWS an enricher claimed is decided by object identity: an enricher
 * signals "not mine" by returning the SAME reference it was given, which every
 * adapter already does via `if (!claimed.has(o.id)) return o`. Asserted for
 * every adapter in test/adapterContract.ts so it is a contract, not a habit.
 *
 * WHICH FIELDS to take is decided per field, not per row. Running concurrently
 * means every enricher sees the ORIGINAL row, so two adapters that refine
 * different parts of the same opportunity — StackingDAO supplies a stacking
 * rate, Hiro supplies that row's TVL from chain state — each return a row
 * carrying only their own change. Taking the whole row from the last writer
 * would silently discard the other one's work; under sequential chaining that
 * could not happen, because each enricher saw the previous one's output.
 *
 * So a field is overwritten only by an enricher that actually changed it, and
 * later enrichers still win any field two of them set. List order remains the
 * authority ranking; concurrency changed only when the work happens.
 */
function mergeOverlays(
  base: NormalizedOpportunity[],
  overlays: Array<{ enricher: EnrichmentAdapter; rows: NormalizedOpportunity[] | null; ms: number }>,
  emit: (record: LogRecord) => void,
): NormalizedOpportunity[] {
  const merged: NormalizedOpportunity[] = base.map(o => ({ ...o }));
  const claimedBy = new Map<string, number>();

  for (const { enricher, rows } of overlays) {
    if (!rows) continue; // threw; already reported
    let claimed = 0;

    for (let i = 0; i < base.length; i++) {
      const row = rows[i];
      // A length or order mismatch means this enricher did not honour the
      // contract; skip rather than splice an unrelated row into place.
      if (!row || row.id !== base[i].id) continue;
      if (row === base[i]) continue; // untouched — not this adapter's row

      claimed++;
      const original = base[i] as unknown as Record<string, unknown>;
      const updated = row as unknown as Record<string, unknown>;
      const target = merged[i] as unknown as Record<string, unknown>;
      for (const key of Object.keys(updated)) {
        if (!Object.is(updated[key], original[key])) target[key] = updated[key];
      }
    }

    claimedBy.set(enricher.source, claimed);
  }

  for (const { enricher, rows, ms } of overlays) {
    if (!rows) continue;
    const claimed = claimedBy.get(enricher.source) ?? 0;
    // A source that answers but matches nothing looks perfectly healthy from
    // outside, and is the earliest warning that a mapping has gone stale.
    emit(
      claimed === 0
        ? { event: 'enricher.claimedNothing', source: enricher.source, durationMs: ms }
        : { event: 'enricher.applied', source: enricher.source, claimed, durationMs: ms },
    );
  }

  return merged;
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

  /**
   * Telemetry must never be able to break a refresh. A sink that throws is a
   * monitoring problem; taking the dashboard down over it would turn a
   * monitoring problem into an outage.
   */
  function emit(record: LogRecord): void {
    try {
      deps.log(record);
    } catch {
      // Nowhere to report this that would not have the same failure mode.
    }
  }

  async function assemble(): Promise<{ opportunities: YieldOpportunity[]; chainTvl: number }> {
    const refreshStartedAt = deps.now();

    // Kicked off first and awaited last: the header statistic depends on
    // nothing else in the pipeline, so making it wait for enrichment added its
    // whole latency to the refresh for no reason.
    const chainTvlPromise = deps.chainTvlSource().catch(() => 0);
    // 1. Gather normalized opportunities from every origin adapter. A source
    //    that throws is skipped rather than failing the whole refresh.
    const gathered = await Promise.all(deps.originAdapters.map(a => a.fetchOpportunities().catch(() => [])));
    let normalized: NormalizedOpportunity[] = gathered.flat();

    // 2. Enrich with live data. Every enricher sees the same input and they run
    //    CONCURRENTLY, so a refresh costs the slowest upstream rather than the
    //    sum of all of them — six sequential calls measured 20-46s against a
    //    60s cache, which a first-time visitor waits through.
    //
    //    Precedence is unchanged: results are merged in list order, so the list
    //    still reads least to most authoritative and a later enricher still
    //    wins a contested row. What changed is that precedence now comes from
    //    the list, not from whichever upstream happened to answer first.
    //
    //    A throwing enricher is skipped like a failing origin source: losing one
    //    live overlay degrades the reading, it must never fail the refresh and
    //    take the dashboard down with it.
    const overlays = await Promise.all(
      deps.enrichmentAdapters.map(async enricher => {
        const startedAt = deps.now();
        try {
          const rows = await enricher.enrich(normalized);
          return { enricher, rows, ms: deps.now() - startedAt };
        } catch (e) {
          emit({
            event: 'enricher.failed',
            source: enricher.source,
            reason: e instanceof Error ? e.message : String(e),
            durationMs: deps.now() - startedAt,
          });
          return { enricher, rows: null, ms: deps.now() - startedAt };
        }
      }),
    );

    normalized = mergeOverlays(normalized, overlays, emit);

    // 3. Risk assessment (explainable sub-factors).
    const risks = new Map<string, RiskAssessment>(normalized.map(o => [o.id, assessRisk(o)]));

    // 4. Risk-adjusted scoring (normalized across the live set).
    const scores = buildScores(normalized, risks);

    // 5. Compose canonical domain objects.
    const opportunities = normalized.map(o => toOpportunity(o, risks.get(o.id)!, scores.get(o.id)!));

    // A header statistic is never worth failing the refresh for: 0 renders as
    // unavailable rather than as a real zero.
    const chainTvl = await chainTvlPromise;

    // The one record worth alerting on. Everything in this pipeline fails soft,
    // so a broken source shows up here as live coverage falling — never as an
    // error. Watch this number, not the error rate.
    const live = opportunities.filter(o => o.status !== 'coming-soon');
    emit({
      event: 'refresh.complete',
      rows: opportunities.length,
      live: live.filter(o => !o.scoresEstimated).length,
      estimated: live.filter(o => o.scoresEstimated).length,
      chainTvlUsd: chainTvl,
      durationMs: deps.now() - refreshStartedAt,
    });

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
