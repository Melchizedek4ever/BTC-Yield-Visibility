'use client';

import { formatTvl, formatApy } from '@/lib/utils';
import type { GlobalStats } from '@/lib/types';

interface TickProps {
  label: string;
  value: string;
  accent?: string;
}

function Tick({ label, value, accent }: TickProps) {
  return (
    <div className="flex-1 min-w-[140px] px-4 py-3" style={{ borderRight: '1px solid var(--border)' }}>
      <div className="font-mono-data text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>
        {label}
      </div>
      <div className="font-mono-data text-xl" style={{ color: accent ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

interface StatsBarProps {
  stats: GlobalStats | null;
  loading?: boolean;
}

export default function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return <div className="h-[68px] mb-6 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />;
  }

  return (
    <div
      className="flex flex-wrap mb-6 overflow-x-auto"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <Tick label="Stacks DeFi TVL" value={formatTvl(stats.totalTvl)} />
      <Tick label="Best APY" value={formatApy(stats.bestApy)} accent="var(--gold)" />
      <Tick label="Safest APY" value={formatApy(stats.safestApy)} accent="var(--safe)" />
      <Tick label="Sources tracked" value={stats.activeSourceCount.toString()} />
      <Tick
        label="Data quality"
        value={stats.estimatedCount > 0 ? `${stats.estimatedCount} est.` : 'all live'}
        accent={stats.estimatedCount > 0 ? 'var(--caution)' : 'var(--safe)'}
      />
    </div>
  );
}
