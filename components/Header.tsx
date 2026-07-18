'use client';

import { useDashboardStore } from '@/lib/store';
import { timeAgo } from '@/lib/utils';
import { BitcoinMark } from './icons/BitcoinMark';
import { StacksMark } from './icons/StacksMark';
import DataConfidence from './DataConfidence';

interface HeaderProps {
  lastUpdated?: string;
  liveCount?: number;
  totalCount?: number;
}

export default function Header({ lastUpdated, liveCount = 0, totalCount = 0 }: HeaderProps) {
  const { mode, setMode } = useDashboardStore();

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 flex-none">
              <BitcoinMark size={44} />
              <div
                className="absolute -bottom-1 -right-1 w-[22px] h-[22px] flex items-center justify-center rounded-full"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border-strong)' }}
                title="Powered by Stacks"
              >
                <StacksMark size={15} />
              </div>
            </div>
            <div>
              <div className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text)' }}>
                Bitcoin Yield <span style={{ color: 'var(--text-faint)' }}>Intelligence</span>
              </div>
              <div className="font-mono-data text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                Stacks Ecosystem · Risk-Adjusted Yield
              </div>
            </div>
          </div>
          <div className="ml-2">
            <DataConfidence liveCount={liveCount} totalCount={totalCount} lastUpdated={lastUpdated} />
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
