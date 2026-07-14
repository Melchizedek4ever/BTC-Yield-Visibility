'use client';

import { useDashboardStore } from '@/lib/store';
import { formatTvl, formatApy, apyColor, riskColor, healthColor, opportunityColor, ilRiskColor, isTopPick, riskTier, COMING_SOON_COLOR } from '@/lib/utils';
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
      <div className="h-1 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

const dim = <span style={{ color: 'var(--text-dim)' }}>—</span>;

export default function DataTable({ protocols, loading }: DataTableProps) {
  const { category, sortKey, sortDesc, setSortKey, visibleMetrics } = useDashboardStore();

  const show = (key?: string) => !key || visibleMetrics.has(key);
  const visibleCols = COL_DEFS.filter(c => show(c.metricKey));

  const filtered = category === 'All' ? protocols : protocols.filter(p => p.category === category);
  const sorted = [...filtered].sort((a, b) => {
    const acs = a.status === 'coming-soon' ? 1 : 0;
    const bcs = b.status === 'coming-soon' ? 1 : 0;
    if (acs !== bcs) return acs - bcs;
    const av = (a as unknown as Record<string, number>)[sortKey];
    const bv = (b as unknown as Record<string, number>)[sortKey];
    return sortDesc ? bv - av : av - bv;
  });

  if (loading) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />;
  }

  // Renders the cell content for a given column + protocol. Header and body both
  // iterate `visibleCols`, so columns can never drift out of alignment.
  function renderCell(colKey: string, p: YieldProtocol, comingSoon: boolean) {
    const tier = riskTier(p.riskScore);
    switch (colKey) {
      case 'name': {
        const accent = comingSoon ? COMING_SOON_COLOR : tier.color;
        const topPick = !comingSoon && isTopPick(p.opportunityScore, p.riskScore);
        return (
          <div className="flex items-center gap-2">
            <span style={{ color: comingSoon ? 'var(--orange)' : undefined }}>{p.icon}</span>
            <div>
              <div className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                {p.shortName}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: accent + '26', color: accent, border: `1px solid ${accent}66` }}>
                  {comingSoon ? 'Unrated' : tier.label}
                </span>
              </div>
              {comingSoon ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: COMING_SOON_COLOR, color: '#fff' }}>
                  Coming Soon · {p.launchTarget}
                </span>
              ) : topPick && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--orange)', color: '#fff' }}>
                  Top Pick
                </span>
              )}
            </div>
          </div>
        );
      }
      case 'category':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            {p.category}
          </span>
        );
      case 'apy':
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <div className="font-bold text-lg" style={{ color: comingSoon ? 'var(--text-dim)' : apyColor(p.apy) }}>
                {comingSoon ? `~${formatApy(p.apy)}` : formatApy(p.apy)}
              </div>
              {p.scoresEstimated && !comingSoon && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: '#2a1a00', color: '#F59E0B', border: '1px solid #F59E0B22' }}
                  title="No live data available — showing curated baseline values."
                >
                  est.
                </span>
              )}
              {p.isStale && !comingSoon && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: '#0a1a2e', color: '#3B82F6', border: '1px solid #3B82F622' }}
                  title="Live APY looked anomalous — showing the last known good value instead."
                >
                  stale
                </span>
              )}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {comingSoon ? 'target' : `${p.apyRange.min}–${p.apyRange.max}%`}
            </div>
          </div>
        );
      case 'tvlUsd':
        return <span className="font-medium">{comingSoon ? dim : formatTvl(p.tvlUsd)}</span>;
      case 'riskScore':
        return <MiniBar value={p.riskScore} color={riskColor(p.riskScore)} />;
      case 'healthScore':
        return comingSoon ? dim : <MiniBar value={p.healthScore} color={healthColor(p.healthScore)} />;
      case 'opportunityScore':
        return comingSoon ? dim : <MiniBar value={p.opportunityScore} color={opportunityColor(p.opportunityScore)} />;
      case 'ilRisk':
        return p.category === 'DEX/LP'
          ? <span className="font-semibold" style={{ color: ilRiskColor(p.ilRisk) }}>{p.ilRisk}</span>
          : dim;
      case 'lockupPeriod':
        return (
          <span className="text-xs" style={{ color: 'var(--text-dim)', display: 'inline-block', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.lockupPeriod}
          </span>
        );
      case 'audited':
        return comingSoon ? dim : <span style={{ color: p.audited ? '#22C55E' : '#EF4444' }}>{p.audited ? '✓' : '✗'}</span>;
      case 'earnAsset':
        return <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{p.earnAsset}</span>;
      default:
        return null;
    }
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
                  {col.sortable && sortKey === col.key && <span className="ml-1">{sortDesc ? '↓' : '↑'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const comingSoon = p.status === 'coming-soon';
              const tier = riskTier(p.riskScore);
              const accent = comingSoon ? COMING_SOON_COLOR : tier.color;
              return (
                <tr
                  key={p.id}
                  className="risk-row cursor-pointer"
                  data-tier={comingSoon ? 'soon' : tier.key}
                  style={{
                    background: (comingSoon ? COMING_SOON_COLOR : tier.color) + '14',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `4px solid ${accent}`,
                    opacity: comingSoon ? 0.9 : 1,
                  }}
                  onClick={() => window.open(comingSoon ? p.websiteUrl : p.appUrl, '_blank', 'noopener,noreferrer')}
                >
                  {visibleCols.map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {renderCell(col.key as string, p, comingSoon)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}