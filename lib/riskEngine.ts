import type { NormalizedOpportunity } from '@/adapters/types';
import { classifyRewardAsset } from '@/domain/asset';
import type { AssetTier } from '@/domain/asset';
import type { IlRisk, ProtocolCategory } from '@/domain/protocol';
import type { RiskAssessment, RiskFactor } from '@/domain/riskAssessment';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const SC_RISK_BASE: Record<string, number> = { 'Very Low': 1.5, Low: 3, Medium: 5.5, High: 8 };

/**
 * Impermanent loss is principal risk, not yield risk: an LP can end up with
 * fewer sats than they deposited while the advertised APY still reads well.
 * The seed data already classifies every opportunity's exposure, so the bands
 * map that classification onto the shared 1–10 scale.
 */
const IL_RISK_BASE: Record<IlRisk, number> = { None: 1, Low: 3, Medium: 6, High: 8.5 };

const IL_RATIONALE: Record<IlRisk, string> = {
  None: 'Single-asset position — no impermanent loss.',
  Low: 'Correlated pair — limited impermanent loss.',
  Medium: 'Mixed-volatility pair — meaningful impermanent loss.',
  High: 'Volatile pair — impermanent loss can outweigh the yield earned.',
};

/**
 * What the yield is actually paid in. "11% APY" denominated in a governance
 * token is a different offer from 11% in Bitcoin, and the emissions share alone
 * does not catch it: a protocol paying its own token as *base* yield reads as
 * fully sustainable while leaving the holder exposed to that token.
 */
const REWARD_TIER_SCORE: Record<AssetTier, number> = {
  bitcoin: 1,
  stablecoin: 3,
  native: 4.5,
  protocol: 8,
};

function assessRewardQuality(rewardAssets: string[]): RiskFactor {
  if (rewardAssets.length === 0) {
    return { score: 5.5, rationale: 'Reward asset not disclosed.' };
  }

  const tiers = rewardAssets.map(classifyRewardAsset);
  const score = tiers.reduce((sum, t) => sum + REWARD_TIER_SCORE[t], 0) / tiers.length;
  const names = rewardAssets.join(', ');
  const btcCount = tiers.filter(t => t === 'bitcoin').length;

  const rationale =
    btcCount === tiers.length
      ? `Paid in ${names} — yield accrues in Bitcoin.`
      : btcCount === 0
        ? `Paid in ${names} — none of the yield accrues in Bitcoin.`
        : `Paid in ${names} — only part of the yield accrues in Bitcoin.`;

  return { score: clamp(score, 1, 10), rationale };
}

/**
 * Counterparty risk: how much discretion sits between a depositor and their
 * yield. Staking is protocol-native; a managed strategy depends on an operator
 * executing it correctly, and can fail while every contract behaves as written.
 * Derived from category because that is what the seed already records —
 * a curated per-protocol signal can replace this without changing the seam.
 */
const COUNTERPARTY_SCORE: Record<ProtocolCategory, number> = {
  Staking: 2,
  Lending: 4.5,
  'DEX/LP': 5.5,
  Yield: 7,
};

const COUNTERPARTY_RATIONALE: Record<ProtocolCategory, string> = {
  Staking: 'Protocol-native staking — minimal third-party exposure.',
  Lending: 'Lending market — exposed to borrower default and liquidation failure.',
  'DEX/LP': 'AMM pool — exposed to pool composition and arbitrage flow.',
  Yield: 'Managed strategy — returns depend on an operator executing it correctly.',
};

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

  // Impermanent-loss risk: paired positions can lose principal outright.
  const impermanentLossRisk: RiskFactor = {
    score: IL_RISK_BASE[o.ilRisk],
    rationale: IL_RATIONALE[o.ilRisk],
  };

  // Reward-quality risk: is the yield actually Bitcoin?
  const rewardQualityRisk = assessRewardQuality(o.rewardAssets);

  // Counterparty risk: how much third-party discretion the yield depends on.
  const counterpartyRisk: RiskFactor = {
    score: COUNTERPARTY_SCORE[o.protocol.category],
    rationale: COUNTERPARTY_RATIONALE[o.protocol.category],
  };

  const overallScore = o.seedRiskScore;

  const drivers: Array<[string, number]> = [
    ['smart-contract', smartContractRisk.score],
    ['liquidity', liquidityRisk.score],
    ['protocol age', protocolAgeRisk.score],
    ['yield sustainability', yieldSustainabilityRisk.score],
    ['impermanent loss', impermanentLossRisk.score],
    ['reward quality', rewardQualityRisk.score],
    ['counterparty', counterpartyRisk.score],
  ];
  drivers.sort((a, b) => b[1] - a[1]);

  const explanation =
    o.status === 'coming-soon'
      ? 'Unrated until live.'
      : `Overall risk ${overallScore}/10 — driven mostly by ${drivers[0][0]} and ${drivers[1][0]} risk.`;

  return {
    overallScore,
    smartContractRisk,
    liquidityRisk,
    protocolAgeRisk,
    yieldSustainabilityRisk,
    impermanentLossRisk,
    rewardQualityRisk,
    counterpartyRisk,
    explanation,
  };
}
