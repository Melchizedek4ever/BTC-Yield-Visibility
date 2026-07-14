/**
 * A transparent, explainable risk breakdown. Every sub-factor carries its own
 * 1–10 score (higher = riskier) and a plain-language rationale, so the UI can
 * answer "why is this ranked where it is?".
 */
export interface RiskFactor {
  /** 1 (safest) → 10 (riskiest). */
  score: number;
  rationale: string;
}

export interface RiskAssessment {
  /** 1 (safest) → 10 (riskiest). */
  overallScore: number;
  smartContractRisk: RiskFactor;
  liquidityRisk: RiskFactor;
  protocolAgeRisk: RiskFactor;
  yieldSustainabilityRisk: RiskFactor;
  /** One-line human summary of the dominant risk drivers. */
  explanation: string;
}
