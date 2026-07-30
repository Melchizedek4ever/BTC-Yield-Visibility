import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { assessRisk } from '@/lib/riskEngine';
import { buildScores } from '@/lib/scoringEngine';
import { makeOpportunity } from '@/test/factories';
import type { NormalizedOpportunity } from '@/adapters/types';
import type { RiskAssessment } from '@/domain/riskAssessment';

/**
 * Seam under test: buildScores() — the risk-adjusted ranking interface.
 *
 * Risk inputs come from the real assessRisk() (a public seam, not a mock).
 * Characterization tests pin the emission discount, normalization, and
 * coming-soon rules; property tests prove the charter's core promise:
 * higher APY alone never wins — risk always drags the ranking.
 */

function score(opps: NormalizedOpportunity[]) {
  const risks = new Map<string, RiskAssessment>(opps.map(o => [o.id, assessRisk(o)]));
  return buildScores(opps, risks);
}

describe('score components', () => {
  test('emissions are credited at 30% of organic yield', () => {
    // base 5 + 0.3 × reward 10 = 8 (worked example, independent of the code)
    const o = makeOpportunity({ apy: 15, apyBase: 5, apyReward: 10 });
    const s = score([o]).get(o.id)!;
    expect(s.realYield).toBe(8);
    expect(s.baseYield).toBe(5);
    expect(s.incentiveYield).toBe(10);
  });

  test('sustainability is the organic share of headline APY', () => {
    const o = makeOpportunity({ apy: 10, apyBase: 6, apyReward: 4 });
    expect(score([o]).get(o.id)!.sustainability).toBe(0.6);
  });

  test('risk penalty is the overall risk scaled to 0–1', () => {
    const o = makeOpportunity({ seedRiskScore: 7 });
    expect(score([o]).get(o.id)!.riskPenalty).toBe(0.7);
  });
});

describe('final score normalization', () => {
  test('with two live opportunities, best raw maps to 10 and worst to 1', () => {
    const strong = makeOpportunity({ id: 'strong', apy: 8, apyBase: 8, apyReward: 0, seedRiskScore: 2 });
    const weak = makeOpportunity({ id: 'weak', apy: 8, apyBase: 1, apyReward: 7, seedRiskScore: 8 });
    const scores = score([strong, weak]);
    expect(scores.get('strong')!.finalScore).toBe(10);
    expect(scores.get('weak')!.finalScore).toBe(1);
  });

  test('a single live opportunity sits at the midpoint 5', () => {
    const o = makeOpportunity();
    expect(score([o]).get(o.id)!.finalScore).toBe(5);
  });

  test('coming-soon opportunities score 0 and never compete', () => {
    const live = makeOpportunity({ id: 'live' });
    const soon = makeOpportunity({ id: 'soon', status: 'coming-soon' });
    const scores = score([live, soon]);
    expect(scores.get('soon')!.finalScore).toBe(0);
    expect(scores.get('live')!.finalScore).toBe(5); // alone in the live set
  });

  // Characterization: an all-coming-soon set currently survives only because
  // the coming-soon branch forces 0 before the degenerate min/max is used.
  test('an all-coming-soon set produces all zeros without crashing', () => {
    const a = makeOpportunity({ id: 'a', status: 'coming-soon' });
    const b = makeOpportunity({ id: 'b', status: 'coming-soon' });
    const scores = score([a, b]);
    expect(scores.get('a')!.finalScore).toBe(0);
    expect(scores.get('b')!.finalScore).toBe(0);
  });
});

// ── Invariants ─────────────────────────────────────────────────────────────

/** Live opportunities with consistent APY split and varied risk inputs. */
const liveOpportunityArb = fc
  .record({
    apy: fc.double({ min: 0, max: 1000, noNaN: true }),
    rewardShare: fc.double({ min: 0, max: 1, noNaN: true }),
    tvlUsd: fc.double({ min: 0, max: 1e12, noNaN: true }),
    healthScore: fc.double({ min: 1, max: 10, noNaN: true }),
    seedRiskScore: fc.double({ min: 1, max: 10, noNaN: true }),
  })
  .map(r =>
    makeOpportunity({
      apy: r.apy,
      apyBase: r.apy * (1 - r.rewardShare),
      apyReward: r.apy * r.rewardShare,
      tvlUsd: r.tvlUsd,
      healthScore: r.healthScore,
      seedRiskScore: r.seedRiskScore,
    })
  );

const liveSetArb = fc
  .array(liveOpportunityArb, { minLength: 1, maxLength: 12 })
  .map(opps => opps.map((o, i) => ({ ...o, id: `opp-${i}` })));

describe('invariants (property-based)', () => {
  test('every live final score stays within 1–10, whatever the set', () => {
    fc.assert(
      fc.property(liveSetArb, opps => {
        const scores = score(opps);
        for (const o of opps) {
          const s = scores.get(o.id)!;
          expect(s.finalScore).toBeGreaterThanOrEqual(1);
          expect(s.finalScore).toBeLessThanOrEqual(10);
        }
      })
    );
  });

  test('real yield never exceeds headline APY; sustainability stays 0–1', () => {
    fc.assert(
      fc.property(liveSetArb, opps => {
        const scores = score(opps);
        for (const o of opps) {
          const s = scores.get(o.id)!;
          expect(s.realYield).toBeLessThanOrEqual(o.apy + 0.01); // 2dp rounding slack
          expect(s.sustainability).toBeGreaterThanOrEqual(0);
          expect(s.sustainability).toBeLessThanOrEqual(1);
        }
      })
    );
  });

  // The charter's core promise: identical yield at higher risk never ranks higher.
  test('higher risk never outranks an otherwise identical opportunity', () => {
    fc.assert(
      fc.property(
        liveOpportunityArb,
        fc.double({ min: 1, max: 10, noNaN: true }),
        fc.double({ min: 1, max: 10, noNaN: true }),
        (base, riskA, riskB) => {
          const [safe, risky] = riskA <= riskB ? [riskA, riskB] : [riskB, riskA];
          const a = { ...base, id: 'safe', seedRiskScore: safe };
          const b = { ...base, id: 'risky', seedRiskScore: risky };
          const scores = score([a, b]);
          expect(scores.get('safe')!.finalScore).toBeGreaterThanOrEqual(scores.get('risky')!.finalScore);
        }
      )
    );
  });
});
