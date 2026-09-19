import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { countConfidenceSources, getDataConfidence } from '@/lib/dataConfidence';
import type { YieldProtocol } from '@/lib/types';

/**
 * Seam: getDataConfidence(). This is the number a reader treats as our
 * credibility claim — the badge saying "LIVE MARKET DATA · 82%" — and it had
 * no tests at all. Every assertion below is an independent literal or a worked
 * example, never the formula restated.
 */

describe('confidence percentage', () => {
  test('is the share of sources on live data, rounded to a whole number', () => {
    // 8 of 11 is 72.72...%, which must present as a round number rather than
    // implying precision the underlying counts do not have.
    expect(getDataConfidence(8, 11).confidence).toBe(73);
    expect(getDataConfidence(1, 3).confidence).toBe(33);
    expect(getDataConfidence(2, 3).confidence).toBe(67);
  });

  test('is 100 only when every source is live', () => {
    expect(getDataConfidence(11, 11).confidence).toBe(100);
    expect(getDataConfidence(10, 11).confidence).toBe(91);
  });

  test('is 0 when no source is live', () => {
    expect(getDataConfidence(0, 12).confidence).toBe(0);
  });
});

describe('states', () => {
  test('reports connecting before any source is known', () => {
    const info = getDataConfidence(0, 0);
    expect(info.state).toBe('connecting');
    expect(info.confidence).toBe(0);
    expect(info.label).toBe('Connecting');
  });

  test('claims live market data only when all sources are matched', () => {
    const info = getDataConfidence(12, 12);
    expect(info.state).toBe('live');
    expect(info.label).toBe('Live Market Data');
    expect(info.description).toContain('All 12');
  });

  test('reports mixed sources when some are live and some are not', () => {
    const info = getDataConfidence(8, 11);
    expect(info.state).toBe('mixed');
    expect(info.label).toBe('Mixed Sources');
    // The reader is told the split outright, not just the percentage.
    expect(info.description).toContain('8 of 11');
  });

  test('reports estimated data when nothing is live', () => {
    const info = getDataConfidence(0, 12);
    expect(info.state).toBe('estimated');
    expect(info.label).toBe('Estimated Data');
    expect(info.description).toContain('No sources');
  });

  test('a single live source out of one reads as fully live, not as mixed', () => {
    expect(getDataConfidence(1, 1).state).toBe('live');
  });
});

describe('presentation', () => {
  test('every state carries a colour and a non-empty description', () => {
    for (const [live, total] of [
      [0, 0],
      [0, 5],
      [3, 5],
      [5, 5],
    ] as const) {
      const info = getDataConfidence(live, total);
      expect(info.color.length).toBeGreaterThan(0);
      expect(info.description.length).toBeGreaterThan(0);
      expect(info.label.length).toBeGreaterThan(0);
    }
  });

  test('never claims live market data while any source is estimated', () => {
    // The failure that matters most: a badge saying "LIVE" over curated
    // numbers is the single most damaging thing this component could render.
    for (let live = 0; live < 12; live++) {
      expect(getDataConfidence(live, 12).state).not.toBe('live');
    }
  });
});

describe('invariants', () => {
  test('confidence stays within 0-100 for any counts', () => {
    fc.assert(
      fc.property(fc.nat({ max: 500 }), fc.nat({ max: 500 }), (live, total) => {
        const { confidence } = getDataConfidence(Math.min(live, total), total);
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(100);
      }),
    );
  });

  test('more live sources never lowers confidence', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), fc.nat({ max: 200 }), (total, raw) => {
        const live = raw % total;
        const here = getDataConfidence(live, total).confidence;
        const more = getDataConfidence(live + 1, total).confidence;
        expect(more).toBeGreaterThanOrEqual(here);
      }),
    );
  });

  test('the live state is reachable only at full coverage', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), fc.nat({ max: 200 }), (total, raw) => {
        const live = raw % (total + 1);
        const isLive = getDataConfidence(live, total).state === 'live';
        expect(isLive).toBe(live === total);
      }),
    );
  });
});

/**
 * Seam: countConfidenceSources(). This was an expression inside Dashboard.tsx,
 * which put the arithmetic behind the product's credibility claim somewhere
 * nothing could test it.
 */
describe('counting which sources the badge speaks for', () => {
  const row = (over: Partial<YieldProtocol>) => ({ id: 'r', status: 'live', ...over }) as YieldProtocol;

  test('counts a row with a live reading', () => {
    const counts = countConfidenceSources([row({ scoresEstimated: false })]);
    expect(counts).toEqual({ liveCount: 1, totalCount: 1 });
  });

  test('counts a row on curated estimates against us', () => {
    const counts = countConfidenceSources([
      row({ id: 'a', scoresEstimated: false }),
      row({ id: 'b', scoresEstimated: true }),
    ]);
    expect(counts).toEqual({ liveCount: 1, totalCount: 2 });
  });

  test('ignores rows that have not launched', () => {
    const counts = countConfidenceSources([
      row({ id: 'a', scoresEstimated: false }),
      row({ id: 'b', status: 'coming-soon' }),
    ]);
    expect(counts).toEqual({ liveCount: 1, totalCount: 1 });
  });

  test('ignores rows whose rate nobody publishes', () => {
    // Hermetica is not a sourcing failure — we have stated outright that no
    // rate exists. Leaving it in the denominator caps the badge below 100%
    // permanently and implies a gap we could close, which is the pessimistic
    // kind of dishonesty.
    const counts = countConfidenceSources([
      row({ id: 'a', scoresEstimated: false }),
      row({ id: 'b', scoresEstimated: true, unpublishedRate: 'Managed strategy.' }),
    ]);
    expect(counts).toEqual({ liveCount: 1, totalCount: 1 });
  });

  test('full coverage of rateable rows reads as fully live', () => {
    const counts = countConfidenceSources([
      row({ id: 'a', scoresEstimated: false }),
      row({ id: 'b', scoresEstimated: false }),
      row({ id: 'c', unpublishedRate: 'No rate published.' }),
      row({ id: 'd', status: 'coming-soon' }),
    ]);
    expect(getDataConfidence(counts.liveCount, counts.totalCount).state).toBe('live');
  });

  test('an empty set reads as connecting rather than as a failure', () => {
    const counts = countConfidenceSources([]);
    expect(counts).toEqual({ liveCount: 0, totalCount: 0 });
    expect(getDataConfidence(counts.liveCount, counts.totalCount).state).toBe('connecting');
  });
});
