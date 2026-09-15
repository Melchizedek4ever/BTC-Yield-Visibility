import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { assessRisk } from '@/lib/riskEngine';
import { makeOpportunity, makeProtocol } from '@/test/factories';
import type { IlRisk, ProtocolCategory, SmartContractRisk } from '@/domain/protocol';

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

describe('reward-quality risk', () => {
  const score = (rewardAssets: string[]) =>
    assessRisk(makeOpportunity({ rewardAssets })).rewardQualityRisk.score;

  test('Bitcoin-denominated yield scores the floor', () => {
    const risk = assessRisk(makeOpportunity({ rewardAssets: ['BTC'] }));
    expect(risk.rewardQualityRisk.score).toBe(1);
    expect(risk.rewardQualityRisk.rationale).toBe('Paid in BTC — yield accrues in Bitcoin.');
  });

  test('treats sBTC as Bitcoin-denominated', () => {
    expect(score(['sBTC'])).toBe(1);
  });

  test('ranks stablecoins and the native chain asset above Bitcoin but below protocol tokens', () => {
    expect(score(['USDA'])).toBe(3);
    expect(score(['STX'])).toBe(4.5);
    expect(score(['ALEX'])).toBe(8);
  });

  test('averages across a mixed reward pair', () => {
    // sBTC (1) + ALEX (8) — half the yield is in a token that can decay.
    expect(score(['sBTC', 'ALEX'])).toBe(4.5);
  });

  test('treats an unrecognized symbol as a protocol token', () => {
    // Conservative default: an unknown reward asset is not assumed safe.
    expect(score(['WHATEVER'])).toBe(8);
  });

  test('names the non-Bitcoin assets in the rationale', () => {
    const risk = assessRisk(makeOpportunity({ rewardAssets: ['DIKO', 'USDA'] }));
    expect(risk.rewardQualityRisk.rationale).toBe(
      'Paid in DIKO, USDA — none of the yield accrues in Bitcoin.',
    );
  });

  test('says so plainly when no reward asset is disclosed', () => {
    const risk = assessRisk(makeOpportunity({ rewardAssets: [] }));
    expect(risk.rewardQualityRisk.score).toBe(5.5);
    expect(risk.rewardQualityRisk.rationale).toBe('Reward asset not disclosed.');
  });
});

describe('counterparty risk', () => {
  const score = (category: ProtocolCategory) =>
    assessRisk(makeOpportunity({ protocol: makeProtocol({ category }) })).counterpartyRisk.score;

  test('ranks strategy types by how much discretion sits between you and the yield', () => {
    expect(score('Staking')).toBe(2);
    expect(score('Lending')).toBe(4.5);
    expect(score('DEX/LP')).toBe(5.5);
    expect(score('Yield')).toBe(7);
  });

  test('explains what the exposure actually is', () => {
    const lending = assessRisk(makeOpportunity({ protocol: makeProtocol({ category: 'Lending' }) }));
    expect(lending.counterpartyRisk.rationale).toBe(
      'Lending market — exposed to borrower default and liquidation failure.',
    );

    const managed = assessRisk(makeOpportunity({ protocol: makeProtocol({ category: 'Yield' }) }));
    expect(managed.counterpartyRisk.rationale).toBe(
      'Managed strategy — returns depend on an operator executing it correctly.',
    );
  });
});

describe('overall score and explanation', () => {
  test('is computed from the factors, not read from the curated seed value', () => {
    const lowSeed = assessRisk(makeOpportunity({ seedRiskScore: 1 }));
    const highSeed = assessRisk(makeOpportunity({ seedRiskScore: 10 }));
    expect(lowSeed.overallScore).toBe(highSeed.overallScore);
  });

  test('worked example: a mid-tier staking position', () => {
    // Factors for the default test opportunity:
    //   smart contract   Low, audited          3
    //   liquidity        $30M TVL              4.5
    //   protocol age     24 months             3
    //   sustainability   1 of 6 APY emitted    2.5
    //   impermanent loss None                  1
    //   reward quality   sBTC                  1
    //   counterparty     Staking               2
    // weighted mean 2.565; highest single factor 4.5 (liquidity)
    // overall = 0.7 * 2.565 + 0.3 * 4.5 = 3.1455 -> 3.1
    expect(assessRisk(makeOpportunity()).overallScore).toBe(3.1);
  });

  test('a single severe factor is not averaged away by mild ones', () => {
    // An unaudited High-complexity contract scores 10 while every other factor
    // stays mild. The weighted mean alone reads 4.32 — a "moderate" rating for
    // a position that can lose everything to one contract failure.
    const risk = assessRisk(
      makeOpportunity({ protocol: makeProtocol({ smartContractRisk: 'High', audited: false, audits: [] }) })
    );
    expect(risk.smartContractRisk.score).toBe(10);
    expect(risk.overallScore).toBe(6);
  });

  test('explanation names the two dominant risk drivers', () => {
    // Thin liquidity (9) and young age (8.5) dominate a safe contract (1.5)
    // and organic yield (1). weighted mean 3.245, worst factor 9
    // overall = 0.7 * 3.245 + 0.3 * 9 = 4.9715 -> 5
    const risk = assessRisk(
      makeOpportunity({
        tvlUsd: 1e6,
        apy: 10,
        apyBase: 10,
        apyReward: 0,
        protocol: makeProtocol({ protocolAgeMonths: 3, smartContractRisk: 'Very Low', audited: true }),
      })
    );
    expect(risk.overallScore).toBe(5);
    expect(risk.explanation).toBe('Overall risk 5/10 — driven mostly by liquidity and protocol age risk.');
  });

  test('coming-soon opportunities are unrated, not scored on meaningless factors', () => {
    // An unlaunched protocol has no TVL and no track record, so liquidity and
    // age would read near the ceiling and manufacture a rating out of nothing.
    // 0 sits outside the 1-10 scale and means "not rated".
    const risk = assessRisk(makeOpportunity({ status: 'coming-soon', tvlUsd: 0 }));
    expect(risk.overallScore).toBe(0);
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
    ilRisk: fc.constantFrom<IlRisk>('None', 'Low', 'Medium', 'High'),
    category: fc.constantFrom<ProtocolCategory>('Staking', 'Lending', 'DEX/LP', 'Yield'),
    rewardAssets: fc.array(fc.constantFrom('BTC', 'sBTC', 'STX', 'USDA', 'ALEX'), { maxLength: 3 }),
  })
  .map(r =>
    makeOpportunity({
      apy: r.apy,
      apyBase: r.apy * (1 - r.rewardShare),
      apyReward: r.apy * r.rewardShare,
      tvlUsd: r.tvlUsd,
      seedRiskScore: r.seedRiskScore,
      status: r.status,
      ilRisk: r.ilRisk,
      rewardAssets: r.rewardAssets,
      protocol: makeProtocol({
        category: r.category,
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
        for (const f of [
          risk.smartContractRisk,
          risk.liquidityRisk,
          risk.protocolAgeRisk,
          risk.yieldSustainabilityRisk,
          risk.impermanentLossRisk,
          risk.rewardQualityRisk,
          risk.counterpartyRisk,
        ]) {
          expect(f.score).toBeGreaterThanOrEqual(1);
          expect(f.score).toBeLessThanOrEqual(10);
        }
      })
    );
  });

  test('the overall score stays on the 1-10 scale, or is 0 when unrated', () => {
    fc.assert(
      fc.property(opportunityArb, o => {
        const { overallScore } = assessRisk(o);
        if (o.status === 'coming-soon') {
          expect(overallScore).toBe(0);
        } else {
          expect(overallScore).toBeGreaterThanOrEqual(1);
          expect(overallScore).toBeLessThanOrEqual(10);
        }
      })
    );
  });

  test('the overall always lies between the mildest and the worst factor', () => {
    // The worst-factor term only ever pulls risk upward, and can never push an
    // opportunity outside the range its own factors describe.
    fc.assert(
      fc.property(opportunityArb, o => {
        fc.pre(o.status === 'live');
        const risk = assessRisk(o);
        const scores = [
          risk.smartContractRisk.score,
          risk.liquidityRisk.score,
          risk.protocolAgeRisk.score,
          risk.yieldSustainabilityRisk.score,
          risk.impermanentLossRisk.score,
          risk.rewardQualityRisk.score,
          risk.counterpartyRisk.score,
        ];
        // Tolerance absorbs the single-decimal rounding of the published score.
        expect(risk.overallScore).toBeGreaterThanOrEqual(Math.min(...scores) - 0.05);
        expect(risk.overallScore).toBeLessThanOrEqual(Math.max(...scores) + 0.05);
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
