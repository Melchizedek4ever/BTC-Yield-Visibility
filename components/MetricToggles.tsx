'use client';

import { useDashboardStore } from '@/lib/store';

const TOGGLEABLE_METRICS = [
  { key: 'riskExplanation', label: 'Why' },
  { key: 'tvlUsd', label: 'TVL' },
  { key: 'riskScore', label: 'Risk Score' },
  { key: 'healthScore', label: 'Health Score' },
  { key: 'opportunityScore', label: 'Opportunity' },
  { key: 'ilRisk', label: 'IL Risk' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'lockupPeriod', label: 'Lock-up' },
  { key: 'audited', label: 'Audited' },
];

export default function MetricToggles() {
  const { visibleMetrics, toggleMetric } = useDashboardStore();

  return (
    <div className="flex gap-1.5 flex-wrap mb-5">
      <span className="font-mono-data text-xs uppercase tracking-wide self-center mr-1" style={{ color: 'var(--text-faint)' }}>Metrics</span>
      {TOGGLEABLE_METRICS.map(m => {
        const active = visibleMetrics.has(m.key);
        return (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className="font-mono-data px-2.5 py-1 text-xs transition-colors"
            style={{
              background: active ? 'var(--surface2)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-faint)',
              border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
            }}
            aria-pressed={active}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
