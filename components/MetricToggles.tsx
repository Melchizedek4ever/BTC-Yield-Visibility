'use client';

import { useDashboardStore } from '@/lib/store';

const TOGGLEABLE_METRICS = [
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
    <div className="flex gap-2 flex-wrap mb-5">
      <span className="text-xs self-center mr-1" style={{ color: 'var(--text-dim)' }}>Metrics:</span>
      {TOGGLEABLE_METRICS.map(m => {
        const active = visibleMetrics.has(m.key);
        return (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: active ? '#1a2e1a' : 'var(--surface2)',
              color: active ? 'var(--green)' : 'var(--text-dim)',
              border: `1px solid ${active ? '#22C55E44' : 'var(--border)'}`,
              opacity: active ? 1 : 0.6,
            }}
          >
            {active ? '✓ ' : ''}{m.label}
          </button>
        );
      })}
    </div>
  );
}
