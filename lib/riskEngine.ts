import type { NormalizedOpportunity } from '@/adapters/types';
import type { RiskAssessment, RiskFactor } from '@/domain/riskAssessment';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const SC_RISK_BASE: Record<string, number> = { 'Very Low': 1.5, Low: 3, Medium: 5.5, High: 8 };

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * Decomposes an opportunity's risk into four explainable factors. Each is a
 * standalone signal derived from real attributes; the overall stays anchored to
 * the curated seed value (preserving today's rankings) while the sub-factors
 * make it transparent. When adapters supply full raw signals, the overall can
 * graduate to being computed from these factors.
 */
export function assessRisk(o: NormalizedOpportunity): RiskAssessment {
  // Smart-contract risk: base complexity, penalized if unaudited.
  const scBase = SC_RISK_BASE[o.protocol.smartContractRisk] ?? 5;
  const smartContractRisk: RiskFactor = {
    score: clamp(o.protocol.audited ? scBase : scBase + 2, 1, 10),
    rationale: `${o.protocol.smartContractRisk} contract complexity; ${
      o.protocol.audited ? `audited (${o.protocol.audits.join(', ') || 'unnamed'})` : 'unaudited'
    }.`,
  };

  // Liquidity risk: deeper TVL = easier exit, less price impact.
  const tvl = o.tvlUsd;
  const liqScore = tvl >= 100e6 ? 1.5 : tvl >= 50e6 ? 3 : tvl >= 20e6 ? 4.5 : tvl >= 8e6 ? 6 : tvl >= 3e6 ? 7.5 : 9;
  const liquidityRisk: RiskFactor = {
    score: clamp(liqScore, 1, 10),
    rationale: `${fmtUsd(tvl)} TVL — ${liqScore <= 3 ? 'deep' : liqScore <= 6 ? 'moderate' : 'thin'} liquidity.`,
  };

  // Protocol-age risk: longer track record = more battle-tested.
  const age = o.protocol.protocolAgeMonths;
  const ageScore = age >= 36 ? 1.5 : age >= 24 ? 3 : age >= 12 ? 4.5 : age >= 6 ? 6.5 : 8.5;
  const protocolAgeRisk: RiskFactor = {
    score: clamp(ageScore, 1, 10),
    rationale: age === 0 ? 'Not yet launched.' : `${age} months live.`,
  };

  // Yield-sustainability risk: how much APY depends on token emissions.
  const emissionsShare = o.apy > 0 ? clamp(o.apyReward / o.apy, 0, 1) : 0;
  const yieldSustainabilityRisk: RiskFactor = {
    score: clamp(1 + emissionsShare * 9, 1, 10),
    rationale: `${Math.round(emissionsShare * 100)}% of APY from token emissions${
      emissionsShare > 0.6 ? ' — high dependence on incentives' : ''
    }.`,
  };

  const overallScore = o.seedRiskScore;

  const drivers: Array<[string, number]> = [
    ['smart-contract', smartContractRisk.score],
    ['liquidity', liquidityRisk.score],
    ['protocol age', protocolAgeRisk.score],
    ['yield sustainability', yieldSustainabilityRisk.score],
  ];
  drivers.sort((a, b) => b[1] - a[1]);

  const explanation =
    o.status === 'coming-soon'
      ? 'Unrated until live.'
      : `Overall risk ${overallScore}/10 — driven mostly by ${drivers[0][0]} and ${drivers[1][0]} risk.`;

  return { overallScore, smartContractRisk, liquidityRisk, protocolAgeRisk, yieldSustainabilityRisk, explanation };
}
