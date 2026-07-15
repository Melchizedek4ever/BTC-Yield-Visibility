'use client';

import { useDashboardStore } from '@/lib/store';
import type { Category, SortKey } from '@/lib/types';

const CATEGORIES: Category[] = ['All', 'Staking', 'Lending', 'DEX/LP', 'Yield'];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Opportunity Score', value: 'opportunityScore' },
  { label: 'APY', value: 'apy' },
  { label: 'Risk (low→high)', value: 'riskScore' },
  { label: 'TVL', value: 'tvlUsd' },
  { label: 'Health Score', value: 'healthScore' },
];

export default function Controls() {
  const { category, setCategory, sortKey, setSortKey, sortDesc } = useDashboardStore();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="font-mono-data px-3 py-1.5 text-xs uppercase tracking-wide transition-colors"
            style={{
              background: category === cat ? 'var(--gold-tint)' : 'transparent',
              color: category === cat ? 'var(--gold)' : 'var(--text-dim)',
              border: `1px solid ${category === cat ? 'var(--gold-dim)' : 'var(--border-strong)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="sm:ml-auto flex items-center gap-2">
        <span className="font-mono-data text-xs uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Sort</span>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="font-mono-data text-xs px-2 py-1.5 outline-none cursor-pointer"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text)',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => useDashboardStore.getState().setSortKey(sortKey)}
          className="px-2 py-1.5 text-sm"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border-strong)', color: 'var(--text-dim)' }}
          title={sortDesc ? 'Descending' : 'Ascending'}
          aria-label={sortDesc ? 'Sort descending' : 'Sort ascending'}
        >
          {sortDesc ? '↓' : '↑'}
        </button>
      </div>
    </div>
  );
}
