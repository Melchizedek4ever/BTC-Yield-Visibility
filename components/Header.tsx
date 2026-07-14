'use client';

import { useDashboardStore } from '@/lib/store';
import { timeAgo } from '@/lib/utils';

interface HeaderProps {
  lastUpdated?: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const { mode, setMode } = useDashboardStore();

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">₿</span>
            <div>
              <div className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>
                BTCFi <span style={{ color: 'var(--orange)' }}>Yield Intel</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Stacks Ecosystem</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#052e16', border: '1px solid #16a34a', color: '#22C55E' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" />
            Live
          </div>
          {lastUpdated && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-dim)' }}>
              Updated {timeAgo(lastUpdated)}
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
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setMode('simple')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              background: mode === 'simple' ? 'var(--orange)' : 'transparent',
              color: mode === 'simple' ? '#fff' : 'var(--text-dim)',
            }}
          >
            Simple
          </button>
          <button
            onClick={() => setMode('advanced')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              background: mode === 'advanced' ? 'var(--orange)' : 'transparent',
              color: mode === 'advanced' ? '#fff' : 'var(--text-dim)',
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
