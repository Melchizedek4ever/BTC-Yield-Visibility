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
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: category === cat ? 'var(--orange)' : 'var(--surface2)',
              color: category === cat ? '#fff' : 'var(--text-dim)',
              border: `1px solid ${category === cat ? 'var(--orange)' : 'var(--border)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Sort:</span>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="text-sm rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => useDashboardStore.getState().setSortKey(sortKey)}
          className="px-2 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          title={sortDesc ? 'Descending' : 'Ascending'}
        >
          {sortDesc ? '↓' : '↑'}
        </button>
      </div>
    </div>
  );
}
