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
