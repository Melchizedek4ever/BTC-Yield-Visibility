import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { assessRisk } from '@/lib/riskEngine';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import type { IlRisk, SmartContractRisk } from '@/domain/protocol';

/**
 * Seam under test: assessRisk() — the public risk-decomposition interface.
 *
 * Characterization tests pin current documented behavior (including the
 * curated seedRiskScore passthrough for the overall score); property tests
 * prove the invariants the product promises: every factor is bounded 1–10,
 * riskier inputs never lower a risk score, and results are deterministic.
 */

describe('smart-contract risk', () => {
  test('audited Very Low complexity scores the safest tier', () => {
    const risk = assessRisk(
      makeOpportunity({ protocol: makeProtocol({ smartContractRisk: 'Very Low', audited: true }) })
    );
    expect(risk.smartContractRisk.score).toBe(1.5);
  });

  test('being unaudited adds a 2-point penalty', () => {
    const audited = assessRisk(
      makeOpportunity({ protocol: makeProtocol({ smartContractRisk: 'Low', audited: true }) })
    );
    const unaudited = assessRisk(
      makeOpportunity({ protocol: makeProtocol({ smartContractRisk: 'Low', audited: false, audits: [] }) })
    );
    expect(audited.smartContractRisk.score).toBe(3);
    expect(unaudited.smartContractRisk.score).toBe(5);
  });

  test('unaudited High complexity clamps at the 10 ceiling', () => {
    const risk = assessRisk(
      makeOpportunity({ protocol: makeProtocol({ smartContractRisk: 'High', audited: false, audits: [] }) })
    );
    expect(risk.smartContractRisk.score).toBe(10);
  });

  test('rationale names the audit firms', () => {
    const risk = assessRisk(
      makeOpportunity({ protocol: makeProtocol({ audited: true, audits: ['CoinFabrik', 'Clarity Alliance'] }) })
    );
    expect(risk.smartContractRisk.rationale).toContain('CoinFabrik, Clarity Alliance');
  });
});

describe('liquidity risk', () => {
  test('deep TVL (≥$100M) scores the safest tier', () => {
    const risk = assessRisk(makeOpportunity({ tvlUsd: 150e6 }));
    expect(risk.liquidityRisk.score).toBe(1.5);
    expect(risk.liquidityRisk.rationale).toContain('deep');
  });

  test('thin TVL (<$3M) scores the riskiest tier', () => {
    const risk = assessRisk(makeOpportunity({ tvlUsd: 1e6 }));
    expect(risk.liquidityRisk.score).toBe(9);
    expect(risk.liquidityRisk.rationale).toContain('thin');
  });
});

describe('protocol-age risk', () => {
  test('3+ year track record scores the safest tier', () => {
    const risk = assessRisk(makeOpportunity({ protocol: makeProtocol({ protocolAgeMonths: 40 }) }));
    expect(risk.protocolAgeRisk.score).toBe(1.5);
    expect(risk.protocolAgeRisk.rationale).toBe('40 months live.');
  });

  test('unlaunched protocol scores near the ceiling with a clear rationale', () => {
    const risk = assessRisk(makeOpportunity({ protocol: makeProtocol({ protocolAgeMonths: 0 }) }));
    expect(risk.protocolAgeRisk.score).toBe(8.5);
    expect(risk.protocolAgeRisk.rationale).toBe('Not yet launched.');
  });
});

describe('yield-sustainability risk', () => {
  test('fully organic yield scores the floor', () => {
    const risk = assessRisk(makeOpportunity({ apy: 10, apyBase: 10, apyReward: 0 }));
    expect(risk.yieldSustainabilityRisk.score).toBe(1);
    expect(risk.yieldSustainabilityRisk.rationale).toContain('0% of APY from token emissions');
  });

  test('fully emission-driven yield scores the ceiling and is flagged', () => {
    const risk = assessRisk(makeOpportunity({ apy: 10, apyBase: 0, apyReward: 10 }));
    expect(risk.yieldSustainabilityRisk.score).toBe(10);
    expect(risk.yieldSustainabilityRisk.rationale).toContain('high dependence on incentives');
  });
});

describe('impermanent-loss risk', () => {
  test('a single-asset position carries none', () => {
    const risk = assessRisk(makeOpportunity({ ilRisk: 'None' }));
    expect(risk.impermanentLossRisk.score).toBe(1);
    expect(risk.impermanentLossRisk.rationale).toBe('Single-asset position — no impermanent loss.');
  });

  test('scores each exposure band higher than the last', () => {
    const score = (ilRisk: IlRisk) => assessRisk(makeOpportunity({ ilRisk })).impermanentLossRisk.score;
    expect(score('None')).toBe(1);
    expect(score('Low')).toBe(3);
    expect(score('Medium')).toBe(6);
    expect(score('High')).toBe(8.5);
  });

  test('warns when impermanent loss can outweigh the yield', () => {
    const risk = assessRisk(makeOpportunity({ ilRisk: 'High' }));
    expect(risk.impermanentLossRisk.rationale).toBe(
      'Volatile pair — impermanent loss can outweigh the yield earned.',
    );
  });
});

describe('overall score and explanation', () => {
  // Characterization: the overall is the curated seed value, NOT computed
  // from the sub-factors. Changing that is a deliberate future decision.
  test('overall score is the curated seed risk score', () => {
    const risk = assessRisk(makeOpportunity({ seedRiskScore: 4.2 }));
    expect(risk.overallScore).toBe(4.2);
  });

  test('explanation names the two dominant risk drivers', () => {
    // Thin liquidity (9) and young age (8.5) dominate a safe contract (1.5)
    // and organic yield (1).
    const risk = assessRisk(
      makeOpportunity({
        tvlUsd: 1e6,
        apy: 10,
        apyBase: 10,
        apyReward: 0,
        seedRiskScore: 7,
        protocol: makeProtocol({ protocolAgeMonths: 3, smartContractRisk: 'Very Low', audited: true }),
      })
    );
    expect(risk.explanation).toBe('Overall risk 7/10 — driven mostly by liquidity and protocol age risk.');
  });

  test('coming-soon opportunities are unrated', () => {
    const risk = assessRisk(makeOpportunity({ status: 'coming-soon' }));
    expect(risk.explanation).toBe('Unrated until live.');
  });
});

// ── Invariants ─────────────────────────────────────────────────────────────

const smartContractRiskArb = fc.constantFrom<SmartContractRisk>('Very Low', 'Low', 'Medium', 'High');

/** Any structurally valid opportunity, however extreme its numbers. */
const opportunityArb = fc
  .record({
    apy: fc.double({ min: 0, max: 1000, noNaN: true }),
    rewardShare: fc.double({ min: 0, max: 1, noNaN: true }),
    tvlUsd: fc.double({ min: 0, max: 1e12, noNaN: true }),
    ageMonths: fc.integer({ min: 0, max: 600 }),
    smartContractRisk: smartContractRiskArb,
    audited: fc.boolean(),
    seedRiskScore: fc.double({ min: 1, max: 10, noNaN: true }),
    status: fc.constantFrom('live' as const, 'coming-soon' as const),
  })
  .map(r =>
    makeOpportunity({
      apy: r.apy,
      apyBase: r.apy * (1 - r.rewardShare),
      apyReward: r.apy * r.rewardShare,
      tvlUsd: r.tvlUsd,
      seedRiskScore: r.seedRiskScore,
      status: r.status,
      protocol: makeProtocol({
        protocolAgeMonths: r.ageMonths,
        smartContractRisk: r.smartContractRisk,
        audited: r.audited,
        audits: r.audited ? ['CoinFabrik'] : [],
      }),
    })
  );

describe('invariants (property-based)', () => {
  test('every risk factor stays within 1–10 for any input', () => {
    fc.assert(
      fc.property(opportunityArb, o => {
        const risk = assessRisk(o);
        for (const f of [risk.smartContractRisk, risk.liquidityRisk, risk.protocolAgeRisk, risk.yieldSustainabilityRisk]) {
          expect(f.score).toBeGreaterThanOrEqual(1);
          expect(f.score).toBeLessThanOrEqual(10);
        }
      })
    );
  });

  test('more TVL never increases liquidity risk', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e12, noNaN: true }),
        fc.double({ min: 0, max: 1e12, noNaN: true }),
        (a, b) => {
          const [lo, hi] = a <= b ? [a, b] : [b, a];
          const riskLo = assessRisk(makeOpportunity({ tvlUsd: lo }));
          const riskHi = assessRisk(makeOpportunity({ tvlUsd: hi }));
          expect(riskHi.liquidityRisk.score).toBeLessThanOrEqual(riskLo.liquidityRisk.score);
        }
      )
    );
  });

  test('a larger emissions share never decreases sustainability risk', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (apy, s1, s2) => {
          const [lo, hi] = s1 <= s2 ? [s1, s2] : [s2, s1];
          const scoreAt = (share: number) =>
            assessRisk(makeOpportunity({ apy, apyBase: apy * (1 - share), apyReward: apy * share }))
              .yieldSustainabilityRisk.score;
          expect(scoreAt(hi)).toBeGreaterThanOrEqual(scoreAt(lo));
        }
      )
    );
  });

  test('assessment is deterministic', () => {
    fc.assert(
      fc.property(opportunityArb, o => {
        expect(assessRisk(o)).toEqual(assessRisk(o));
      })
    );
  });
});
