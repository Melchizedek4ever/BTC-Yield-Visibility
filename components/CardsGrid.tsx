'use client';

import ProtocolCard from './ProtocolCard';
import type { YieldProtocol } from '@/lib/types';
import { useDashboardStore } from '@/lib/store';

interface CardsGridProps {
  protocols: YieldProtocol[];
  loading?: boolean;
}

export default function CardsGrid({ protocols, loading }: CardsGridProps) {
  const { category, sortKey, sortDesc } = useDashboardStore();

  const filtered = category === 'All' ? protocols : protocols.filter(p => p.category === category);
  const sorted = [...filtered].sort((a, b) => {
    // Coming-soon sources always sink to the bottom, regardless of sort.
    const acs = a.status === 'coming-soon' ? 1 : 0;
    const bcs = b.status === 'coming-soon' ? 1 : 0;
    if (acs !== bcs) return acs - bcs;
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDesc ? bv - av : av - bv;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-72 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-dim)' }}>
        No protocols match this filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map(p => (
        <ProtocolCard key={p.id} protocol={p} />
      ))}
    </div>
  );
}
