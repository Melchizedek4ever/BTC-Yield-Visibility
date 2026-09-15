import type { NormalizedOpportunity } from '@/adapters/types';
import type { Protocol } from '@/domain/protocol';
import type { RiskAssessment } from '@/domain/riskAssessment';

/**
 * Test-data builders. Defaults describe one realistic mid-tier live
 * opportunity; tests override only the fields their behavior depends on,
 * so each test reads as a spec of exactly what matters.
 */

export function makeProtocol(overrides: Partial<Protocol> = {}): Protocol {
  return {
    id: 'test-protocol',
    name: 'Test Protocol',
    shortName: 'Test',
    slug: 'test-protocol',
    category: 'Staking',
    icon: '/icons/test.svg',
    website: 'https://example.com',
    appUrl: 'https://app.example.com',
    description: 'A protocol used only in tests.',
    protocolAgeMonths: 24,
    audited: true,
    audits: ['CoinFabrik'],
    smartContractRisk: 'Low',
    supportedAssets: ['sBTC'],
    metadata: {},
    ...overrides,
  };
}

export function makeOpportunity(overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity {
  return {
    id: 'test-opportunity',
    protocol: makeProtocol(),
    strategy: 'Stake sBTC',
    depositAsset: 'sBTC',
    rewardAssets: ['sBTC'],
    earnAsset: 'sBTC',
    apy: 6,
    apyBase: 5,
    apyReward: 1,
    apyRange: { min: 4, max: 8 },
    tvlUsd: 30e6,
    tvl7dChange: 0,
    tvl30dChange: 0,
    lockup: 'None',
    ilRisk: 'None',
    minimumDeposit: null,
    healthScore: 8,
    baseline: { apy: 6, tvlUsd: 30e6, reviewedAt: '2026-08-21' },
    status: 'live',
    updatedAt: '2026-07-30T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * A risk assessment with a chosen overall score. Lets tests of downstream
 * consumers (scoring, the service façade) state the risk they depend on
 * directly, instead of reverse-engineering inputs that make the risk engine
 * produce it — which would couple those tests to the engine's internals.
 */
export function makeRiskAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  const factor = (score: number) => ({ score, rationale: 'Test rationale.' });
  return {
    overallScore: 4,
    smartContractRisk: factor(3),
    liquidityRisk: factor(4.5),
    protocolAgeRisk: factor(3),
    yieldSustainabilityRisk: factor(2.5),
    impermanentLossRisk: factor(1),
    rewardQualityRisk: factor(1),
    counterpartyRisk: factor(2),
    explanation: 'Test explanation.',
    ...overrides,
  };
}
