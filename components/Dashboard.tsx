'use client';

import useSWR from 'swr';
import StatsBar from './StatsBar';
import Controls from './Controls';
import MetricToggles from './MetricToggles';
import RiskLegend from './RiskLegend';
import CardsGrid from './CardsGrid';
import DataTable from './DataTable';
import Header from './Header';
import { useDashboardStore } from '@/lib/store';
import type { YieldProtocol, GlobalStats } from '@/lib/types';

interface ApiResponse {
  protocols: YieldProtocol[];
  stats: GlobalStats;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const { mode } = useDashboardStore();

  const { data, isLoading, error } = useSWR<ApiResponse>('/api/yields', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const protocols = data?.protocols ?? [];
  const stats = data?.stats ?? null;
  const lastUpdated = protocols[0]?.lastUpdated;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header lastUpdated={lastUpdated} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            Bitcoin DeFi Yield Intelligence
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Compare, rank, and evaluate yield opportunities across the Stacks ecosystem. Sorted by Opportunity Score — the best risk-adjusted return available right now.
          </p>
        </div>

        <StatsBar stats={stats} loading={isLoading} />

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#1a0000', border: '1px solid #EF444444', color: '#EF4444' }}>
            Failed to load live data. Showing cached seed data.
          </div>
        )}

        <Controls />
        <MetricToggles />
        <RiskLegend />

        {mode === 'simple' ? (
          <CardsGrid protocols={protocols} loading={isLoading} />
        ) : (
          <DataTable protocols={protocols} loading={isLoading} />
        )}

        <div className="mt-8 pt-6 text-xs text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <p>Data sourced from DefiLlama and protocol APIs. APY figures are variable and not guaranteed. This is not financial advice.</p>
          <p className="mt-1">BTCFi Yield Intel — Stacks Ecosystem Dashboard · MVP v1.0</p>
        </div>
      </main>
    </div>
  );
}
