'use client';

import { useDashboardStore } from '@/lib/store';
import { formatTvl, formatApy, riskColor, healthColor, opportunityColor, ilRiskColor, isTopPick, riskTier, initials, COMING_SOON_COLOR } from '@/lib/utils';
import type { YieldProtocol, SortKey } from '@/lib/types';

interface DataTableProps {
  protocols: YieldProtocol[];
  loading?: boolean;
}

const COL_DEFS: { key: SortKey | string; label: string; metricKey?: string; sortable?: boolean }[] = [
  { key: 'name', label: 'Source', sortable: false },
  { key: 'category', label: 'Type', sortable: false },
  { key: 'apy', label: 'APY', sortable: true },
  { key: 'riskScore', label: 'Risk', sortable: true, metricKey: 'riskScore' },
  { key: 'riskExplanation', label: 'Why', metricKey: 'riskExplanation' },
  { key: 'tvlUsd', label: 'TVL', sortable: true, metricKey: 'tvlUsd' },
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
      <span className="font-mono-data" style={{ color, fontWeight: 700 }}>{value.toFixed(1)}</span>
      <div className="h-1 w-14" style={{ background: 'var(--surface2)' }}>
        <div className="h-full" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

const dim = <span style={{ color: 'var(--text-faint)' }}>—</span>;

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
    return <div className="h-64 animate-pulse" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />;
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 px-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="font-mono-data text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>
          No matching opportunities
        </div>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Nothing in this category right now — try a different filter above.
        </p>
      </div>
    );
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
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono-data text-[10px] font-bold w-6 h-6 flex items-center justify-center flex-none"
              style={{ border: `1px solid ${topPick ? 'var(--gold)' : 'var(--border-strong)'}`, color: topPick ? 'var(--gold)' : 'var(--text-dim)' }}
              aria-hidden="true"
            >
              {initials(p.shortName)}
            </span>
            <div>
              <a
                href={comingSoon ? p.websiteUrl : p.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: 'var(--text)' }}
              >
                {p.shortName}
              </a>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono-data text-[9.5px] px-1.5 py-0.5 font-semibold" style={{ color: accent, border: `1px solid ${accent}66` }}>
                  {comingSoon ? 'UNRATED' : tier.label.toUpperCase()}
                </span>
                {comingSoon ? (
                  <span className="font-mono-data text-[9.5px]" style={{ color: 'var(--text-faint)' }}>{p.launchTarget}</span>
                ) : topPick && (
                  <span className="font-mono-data text-[9.5px] px-1.5 py-0.5 font-semibold" style={{ color: 'var(--gold)', border: '1px solid var(--gold-dim)' }}>
                    TOP PICK
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
      case 'category':
        return (
          <span className="font-mono-data text-[10px] px-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--text-dim)', border: '1px solid var(--border-strong)' }}>
            {p.category.toUpperCase()}
          </span>
        );
      case 'apy':
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <div className="font-mono-data text-lg" style={{ color: comingSoon ? 'var(--text-dim)' : tier.color }}>
                {comingSoon ? `~${formatApy(p.apy)}` : formatApy(p.apy)}
              </div>
              {p.scoresEstimated && !comingSoon && (
                <span className="font-mono-data text-[9px] px-1.5 py-0.5" style={{ color: 'var(--caution)', border: '1px solid var(--caution)' }} title="No live data available — showing curated baseline values.">
                  EST.
                </span>
              )}
              {p.isStale && !comingSoon && (
                <span className="font-mono-data text-[9px] px-1.5 py-0.5" style={{ color: 'var(--info)', border: '1px solid var(--info)' }} title="Live APY looked anomalous — showing the last known good value instead.">
                  STALE
                </span>
              )}
            </div>
            <div className="font-mono-data text-[10.5px]" style={{ color: 'var(--text-faint)' }}>
              {comingSoon ? 'target' : `${p.apyRange.min}–${p.apyRange.max}%`}
            </div>
          </div>
        );
      case 'riskExplanation':
        return comingSoon ? dim : (
          <span
            className="text-[11.5px]"
            title={p.riskExplanation}
            style={{ color: 'var(--text-dim)', display: 'inline-block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {p.riskExplanation ?? '—'}
          </span>
        );
      case 'tvlUsd':
        return <span className="font-mono-data font-medium">{comingSoon ? dim : formatTvl(p.tvlUsd)}</span>;
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
        return comingSoon ? dim : <span style={{ color: p.audited ? 'var(--safe)' : 'var(--danger)' }}>{p.audited ? '✓' : '✗'}</span>;
      case 'earnAsset':
        return <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{p.earnAsset}</span>;
      default:
        return null;
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border-strong)' }}>
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  className="font-mono-data px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: sortKey === col.key ? 'var(--gold)' : 'var(--text-faint)', cursor: col.sortable ? 'pointer' : 'default' }}
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
                  className="risk-row"
                  data-tier={comingSoon ? 'soon' : tier.key}
                  style={{
                    background: accent + '0D',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `3px solid ${accent}`,
                    opacity: comingSoon ? 0.85 : 1,
                  }}
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
