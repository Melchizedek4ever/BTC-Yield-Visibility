'use client';

import { useDashboardStore } from '@/lib/store';
import { formatTvl, formatApy, riskColor, healthColor, opportunityColor, ilRiskColor, isTopPick } from '@/lib/utils';
import type { YieldProtocol, SortKey } from '@/lib/types';

interface DataTableProps {
  protocols: YieldProtocol[];
  loading?: boolean;
}

const COL_DEFS: { key: SortKey | string; label: string; metricKey?: string; sortable?: boolean }[] = [
  { key: 'name', label: 'Protocol', sortable: false },
  { key: 'category', label: 'Type', sortable: false },
  { key: 'apy', label: 'APY', sortable: true },
  { key: 'tvlUsd', label: 'TVL', sortable: true, metricKey: 'tvlUsd' },
  { key: 'riskScore', label: 'Risk', sortable: true, metricKey: 'riskScore' },
  { key: 'healthScore', label: 'Health', sortable: true, metricKey: 'healthScore' },
  { key: 'opportunityScore', label: 'Opportunity', sortable: true, metricKey: 'opportunityScore' },
  { key: 'ilRisk', label: 'IL Risk', metricKey: 'ilRisk' },
  { key: 'lockupPeriod', label: 'Lock-up', metricKey: 'lockupPeriod' },
  { key: 'audited', label: 'Audited', metricKey: 'audited' },
  { key: 'earnAsset', label: 'Earn' },
];

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color, fontWeight: 700 }}>{value.toFixed(1)}</span>
      <div className="h-1 w-16 rounded-full" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DataTable({ protocols, loading }: DataTableProps) {
  const { category, sortKey, sortDesc, setSortKey, visibleMetrics } = useDashboardStore();

  const show = (key?: string) => !key || visibleMetrics.has(key);
  const visibleCols = COL_DEFS.filter(c => show(c.metricKey));

  const filtered = category === 'All' ? protocols : protocols.filter(p => p.category === category);
  const sorted = [...filtered].sort((a, b) => {
    const av = (a as unknown as Record<string, number>)[sortKey];
    const bv = (b as unknown as Record<string, number>)[sortKey];
    return sortDesc ? bv - av : av - bv;
  });

  if (loading) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />;
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: sortKey === col.key ? 'var(--orange)' : 'var(--text-dim)', cursor: col.sortable ? 'pointer' : 'default', letterSpacing: '0.5px' }}
                  onClick={() => col.sortable && setSortKey(col.key as SortKey)}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1">{sortDesc ? '↓' : '↑'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const topPick = isTopPick(p.opportunityScore, p.riskScore);
              return (
                <tr
                  key={p.id}
                  className="transition-colors cursor-pointer"
                  style={{
                    background: topPick ? '#FF550008' : i % 2 === 0 ? 'var(--surface)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: topPick ? '2px solid var(--orange)' : '2px solid transparent',
                  }}
                  onClick={() => window.open(p.appUrl, '_blank')}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--text)' }}>{p.shortName}</div>
                        {topPick && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--orange)', color: '#fff' }}>
                            Top Pick
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {show('category') !== false && (
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                        {p.category}
                      </span>
                    </td>
                  )}

                  <td className="px-4 py-3">
                    <div className="font-bold text-lg" style={{ color: '#22C55E' }}>{formatApy(p.apy)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{p.apyRange.min}–{p.apyRange.max}%</div>
                  </td>

                  {show('tvlUsd') && (
                    <td className="px-4 py-3 font-medium">{formatTvl(p.tvlUsd)}</td>
                  )}
                  {show('riskScore') && (
                    <td className="px-4 py-3">
                      <MiniBar value={p.riskScore} color={riskColor(p.riskScore)} />
                    </td>
                  )}
                  {show('healthScore') && (
                    <td className="px-4 py-3">
                      <MiniBar value={p.healthScore} color={healthColor(p.healthScore)} />
                    </td>
                  )}
                  {show('opportunityScore') && (
                    <td className="px-4 py-3">
                      <MiniBar value={p.opportunityScore} color={opportunityColor(p.opportunityScore)} />
                    </td>
                  )}
                  {show('ilRisk') && (
                    <td className="px-4 py-3">
                      {p.category === 'DEX/LP' ? (
                        <span className="font-semibold" style={{ color: ilRiskColor(p.ilRisk) }}>{p.ilRisk}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                  )}
                  {show('lockupPeriod') && (
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-dim)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.lockupPeriod}
                    </td>
                  )}
                  {show('audited') && (
                    <td className="px-4 py-3">
                      <span style={{ color: p.audited ? '#22C55E' : '#EF4444' }}>
                        {p.audited ? '✓' : '✗'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-dim)' }}>{p.earnAsset}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
