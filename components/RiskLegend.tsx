'use client';

import { COMING_SOON_COLOR } from '@/lib/utils';

const TIERS = [
  { label: 'Conservative', color: '#22C55E', range: 'Risk ≤ 2.5' },
  { label: 'Balanced', color: '#EAB308', range: '2.5 – 4.5' },
  { label: 'Elevated', color: '#F97316', range: '4.5 – 6.5' },
  { label: 'Aggressive', color: '#EF4444', range: '> 6.5' },
  { label: 'Coming soon', color: COMING_SOON_COLOR, range: 'Not yet live' },
];

export default function RiskLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5 text-xs" style={{ color: 'var(--text-dim)' }}>
      <span className="uppercase tracking-widest" style={{ letterSpacing: '0.5px' }}>Risk tier:</span>
      {TIERS.map(t => (
        <span key={t.label} className="flex items-center gap-1.5" title={t.range}>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: t.color }} />
          <span style={{ color: 'var(--text)' }}>{t.label}</span>
          <span>({t.range})</span>
        </span>
      ))}
    </div>
  );
}