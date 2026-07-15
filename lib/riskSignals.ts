import type { RiskFactorView } from './types';
import { riskTier } from './utils';

export interface RiskSignal {
  key: string;
  label: string;
  rationale: string;
}

export interface RiskSignals {
  positive: RiskSignal[];
  negative: RiskSignal[];
}

/**
 * Classifies the risk engine's own factors into positive/negative signals,
 * using the same risk-tier thresholds shown everywhere else in the UI.
 * Purely presentational — lib/riskEngine.ts itself is untouched.
 */
export function classifyRiskSignals(factors: RiskFactorView[]): RiskSignals {
  const positive: RiskSignal[] = [];
  const negative: RiskSignal[] = [];

  for (const f of factors) {
    const tier = riskTier(f.score);
    const signal: RiskSignal = { key: f.key, label: f.label, rationale: f.rationale };
    if (tier.key === 'conservative' || tier.key === 'balanced') {
      positive.push(signal);
    } else {
      negative.push(signal);
    }
  }

  return { positive, negative };
}
