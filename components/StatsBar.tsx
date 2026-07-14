'use client';

import { formatTvl, formatApy } from '@/lib/utils';
import type { GlobalStats } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="flex-1 min-w-0 px-4 py-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: accent ?? 'var(--text)' }}>
        {value}
      </div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  );
}

interface StatsBarProps {
  stats: GlobalStats | null;
  loading?: boolean;
}

export default function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Stacks DeFi TVL"
        value={formatTvl(stats.totalTvl)}
        sub="Total value locked"
      />
      <StatCard
        label="Best APY"
        value={formatApy(stats.bestApy)}
        sub="Highest available"
        accent="var(--green)"
      />
      <StatCard
        label="Safest APY"
        value={formatApy(stats.safestApy)}
        sub="Risk score ≤ 3"
        accent="var(--blue)"
      />
      <StatCard
        label="Yield Sources"
        value={stats.activeSourceCount.toString()}
        sub={stats.upcomingCount > 0 ? `Active · ${stats.upcomingCount} coming soon` : 'Active protocols'}
        accent="var(--orange)"
      />
    </div>
  );
}
