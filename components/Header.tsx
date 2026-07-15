'use client';

import { useDashboardStore } from '@/lib/store';
import { timeAgo } from '@/lib/utils';
import { BitcoinMark } from './icons/BitcoinMark';
import { StacksMark } from './icons/StacksMark';

interface HeaderProps {
  lastUpdated?: string;
  liveCount?: number;
  totalCount?: number;
}

export default function Header({ lastUpdated, liveCount = 0, totalCount = 0 }: HeaderProps) {
  const { mode, setMode } = useDashboardStore();

  const hasData = totalCount > 0;
  const isLive = hasData && liveCount === totalCount;
  const isPartiallyLive = hasData && liveCount > 0 && liveCount < totalCount;
  const statusColor = !hasData ? 'var(--text-faint)' : isLive ? 'var(--safe)' : 'var(--caution)';
  const statusLabel = !hasData
    ? 'CONNECTING'
    : isLive
    ? 'LIVE'
    : isPartiallyLive
    ? `${liveCount}/${totalCount} LIVE`
    : 'ESTIMATED';

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex-none">
              <BitcoinMark size={32} />
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}
                title="Powered by Stacks"
              >
                <StacksMark size={10} color="var(--text)" />
              </div>
            </div>
            <div>
              <div className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text)' }}>
                BTC Yield <span style={{ color: 'var(--text-faint)' }}>Visibility</span>
              </div>
              <div className="font-mono-data text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                Stacks Bitcoin Yield Intelligence
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 ml-2 px-2 py-0.5 font-mono-data text-[11px]"
            style={{ border: `1px solid ${statusColor}44`, color: statusColor }}
            title={hasData ? `${liveCount} of ${totalCount} sources on live data; the rest are curated estimates.` : undefined}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: statusColor }} />
            {statusLabel}
          </div>
          {lastUpdated && (
            <span className="font-mono-data text-[11px] hidden sm:block" style={{ color: 'var(--text-faint)' }}>
              UPDATED {timeAgo(lastUpdated).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/methodology"
            className="text-sm hidden sm:block hover:underline"
            style={{ color: 'var(--text-dim)' }}
          >
            Methodology
          </a>
          <div className="flex items-center gap-0.5 p-0.5" style={{ background: 'var(--surface2)', border: '1px solid var(--border-strong)' }}>
            <button
              onClick={() => setMode('simple')}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: mode === 'simple' ? 'var(--gold)' : 'transparent',
                color: mode === 'simple' ? '#0A0C10' : 'var(--text-dim)',
              }}
            >
              Simple
            </button>
            <button
              onClick={() => setMode('advanced')}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: mode === 'advanced' ? 'var(--gold)' : 'transparent',
                color: mode === 'advanced' ? '#0A0C10' : 'var(--text-dim)',
              }}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
