'use client';

import { COMING_SOON_COLOR } from '@/lib/utils';

const TIERS = [
  { label: 'Conservative', color: '#4C9E7C', range: 'Risk ≤ 2.5' },
  { label: 'Balanced', color: '#C4923F', range: '2.5 – 4.5' },
  { label: 'Elevated', color: '#C4753F', range: '4.5 – 6.5' },
  { label: 'Aggressive', color: '#C15850', range: '> 6.5' },
  { label: 'Coming soon', color: COMING_SOON_COLOR, range: 'Not yet live' },
];

export default function RiskLegend() {
  return (
    <div className="font-mono-data flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
      <span className="uppercase tracking-widest">Risk tier</span>
      {TIERS.map(t => (
        <span key={t.label} className="flex items-center gap-1.5" title={t.range}>
          <span className="inline-block w-2.5 h-2.5" style={{ background: t.color }} />
          <span style={{ color: 'var(--text-dim)' }}>{t.label.toUpperCase()}</span>
          <span>({t.range})</span>
        </span>
      ))}
    </div>
  );
}
