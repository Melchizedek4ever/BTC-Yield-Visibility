import type { NormalizedOpportunity } from '@/adapters/types';
import type { RiskAssessment } from '@/domain/riskAssessment';
import type { RiskAdjustedYieldScore } from '@/domain/score';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round = (v: number, d = 2) => parseFloat(v.toFixed(d));

/**
 * Emissions are worth less than organic yield because they're inflationary and
 * decay. We credit only a fraction of incentive APY toward "real" yield.
 */
const EMISSION_CREDIT = 0.3;

interface ScoreParts extends Omit<RiskAdjustedYieldScore, 'finalScore'> {
  raw: number;
}

/**
 * Raw, un-normalized score components for a single opportunity.
 * finalScore is assigned later, relative to the live set.
 */
function computeParts(o: NormalizedOpportunity, risk: RiskAssessment): ScoreParts {
  const baseYield = o.apyBase;
  const incentiveYield = o.apyReward;
  const realYield = baseYield + EMISSION_CREDIT * incentiveYield;
  const sustainability = o.apy > 0 ? clamp(baseYield / o.apy, 0, 1) : 1;
  const riskPenalty = clamp(risk.overallScore / 10, 0, 1);

  // Reward sustainable real yield and protocol health; damp emission-heavy
  // positions; divide by risk so safer opportunities rise. The +0.3 floor keeps
  // ultra-low-risk staking from dividing to infinity.
  const sustainabilityFactor = 0.4 + 0.6 * sustainability;
  const raw = (realYield * (o.healthScore / 10) * sustainabilityFactor) / (0.3 + riskPenalty);

  return { baseYield, incentiveYield, realYield, sustainability, riskPenalty, raw };
}

/**
 * Builds final risk-adjusted scores for every opportunity. finalScore is
 * normalized 1–10 across LIVE opportunities only; coming-soon sources get 0
 * (they don't compete for a ranking until they launch).
 */
export function buildScores(
  opps: NormalizedOpportunity[],
  risks: Map<string, RiskAssessment>
): Map<string, RiskAdjustedYieldScore> {
  const live = opps.filter(o => o.status !== 'coming-soon');
  const partsById = new Map<string, ScoreParts>();
  for (const o of opps) partsById.set(o.id, computeParts(o, risks.get(o.id)!));

  const raws = live.map(o => partsById.get(o.id)!.raw);
  const min = Math.min(...raws);
  const max = Math.max(...raws);

  const out = new Map<string, RiskAdjustedYieldScore>();
  for (const o of opps) {
    const p = partsById.get(o.id)!;
    let finalScore = 0;
    if (o.status !== 'coming-soon') {
      finalScore = max !== min ? round(1 + ((p.raw - min) / (max - min)) * 9, 1) : 5;
    }
    out.set(o.id, {
      baseYield: round(p.baseYield),
      incentiveYield: round(p.incentiveYield),
      realYield: round(p.realYield),
      sustainability: round(p.sustainability),
      riskPenalty: round(p.riskPenalty),
      finalScore,
    });
  }
  return out;
}
