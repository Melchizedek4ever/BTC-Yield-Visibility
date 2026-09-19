import type { YieldProtocol } from './types';

/**
 * Which rows the confidence badge speaks for, and how many of them carry a
 * live reading. Lived as an expression inside Dashboard.tsx, which put the
 * arithmetic behind the product's credibility claim where nothing could test it.
 *
 * Two kinds of row are excluded from BOTH counts rather than counted against us:
 *
 *   coming-soon      — not launched, so there is nothing to read yet.
 *   unpublishedRate  — we have stated outright that no source publishes a rate.
 *
 * The second is the subtle one. Leaving those rows in the denominator caps the
 * badge below 100% permanently and implies a gap we could close by trying
 * harder. Understating our own coverage is still misreporting it.
 */
export function countConfidenceSources(
  protocols: YieldProtocol[],
): { liveCount: number; totalCount: number } {
  const rateable = protocols.filter(p => p.status !== 'coming-soon' && !p.unpublishedRate);
  return {
    liveCount: rateable.filter(p => !p.scoresEstimated).length,
    totalCount: rateable.length,
  };
}

export type DataConfidenceState = 'connecting' | 'live' | 'mixed' | 'estimated';

export interface DataConfidenceInfo {
  state: DataConfidenceState;
  label: string;
  color: string;
  /** 0-100. Share of tracked sources currently matched to live market data. */
  confidence: number;
  description: string;
}

/**
 * Derives a data-confidence reading from real counts — never a hardcoded
 * "Live" claim. `liveCount` is sources with a live DefiLlama match this
 * cycle; `totalCount` excludes coming-soon sources (they're unrated).
 */
export function getDataConfidence(liveCount: number, totalCount: number): DataConfidenceInfo {
  if (totalCount === 0) {
    return {
      state: 'connecting',
      label: 'Connecting',
      color: 'var(--text-faint)',
      confidence: 0,
      description: 'Establishing connections to data sources.',
    };
  }

  const confidence = Math.round((liveCount / totalCount) * 100);

  if (liveCount === totalCount) {
    return {
      state: 'live',
      label: 'Live Market Data',
      color: 'var(--safe)',
      confidence,
      description: `All ${totalCount} tracked sources are matched to live market data from DefiLlama this cycle.`,
    };
  }

  if (liveCount > 0) {
    return {
      state: 'mixed',
      label: 'Mixed Sources',
      color: 'var(--caution)',
      confidence,
      description: `${liveCount} of ${totalCount} sources are on live data. The rest are running on curated baseline estimates until a live match is available.`,
    };
  }

  return {
    state: 'estimated',
    label: 'Estimated Data',
    color: 'var(--caution)',
    confidence,
    description: `No sources are currently matched to live market data. All ${totalCount} values shown are curated baseline estimates, reviewed and maintained manually.`,
  };
}
