'use client';

import { getDataConfidence } from '@/lib/dataConfidence';
import { timeAgo } from '@/lib/utils';

interface DataConfidenceProps {
  liveCount: number;
  totalCount: number;
  lastUpdated?: string;
  /** Compact variant drops the border/padding for use inside a ticker cell. */
  compact?: boolean;
}

/**
 * Reusable trust indicator. Replaces a hardcoded "Live" claim with a state
 * derived from real counts (Live Market Data / Mixed Sources / Estimated
 * Data), a confidence percentage, and an accessible tooltip explaining what
 * the state means — reachable by hover or keyboard focus, not hover-only.
 */
export default function DataConfidence({ liveCount, totalCount, lastUpdated, compact }: DataConfidenceProps) {
  const info = getDataConfidence(liveCount, totalCount);
  const tooltipId = `data-confidence-${compact ? 'compact' : 'default'}`;
  const summary = `${info.label}${totalCount > 0 ? `, ${info.confidence}% confidence` : ''}. ${info.description}`;

  return (
    <div className="relative inline-flex group">
      <button
        type="button"
        className={`flex items-center gap-1.5 font-mono-data text-[11px] ${compact ? '' : 'px-2 py-0.5'}`}
        style={compact ? { color: info.color } : { border: `1px solid ${info.color}44`, color: info.color, background: 'transparent' }}
        aria-describedby={tooltipId}
        aria-label={summary}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${info.state === 'live' ? 'pulse-dot' : ''}`} style={{ background: info.color }} />
        {info.label.toUpperCase()}
        {totalCount > 0 && <span style={{ color: 'var(--text-faint)' }}>· {info.confidence}%</span>}
      </button>

      <div
        id={tooltipId}
        role="tooltip"
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 absolute left-0 top-full mt-2 w-64 z-50 transition-opacity p-3 text-xs pointer-events-none"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border-strong)', color: 'var(--text-dim)', boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
      >
        <div className="font-mono-data font-semibold mb-1" style={{ color: info.color }}>
          {info.label.toUpperCase()}{totalCount > 0 && <> · {info.confidence}%</>}
        </div>
        <p className="leading-relaxed">{info.description}</p>
        {lastUpdated && (
          <div className="font-mono-data text-[10px] mt-2 pt-2" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
            LAST CHECKED {timeAgo(lastUpdated).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
