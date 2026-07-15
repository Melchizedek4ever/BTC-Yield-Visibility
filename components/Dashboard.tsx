'use client';

import useSWR from 'swr';
import StatsBar from './StatsBar';
import Controls from './Controls';
import MetricToggles from './MetricToggles';
import RiskLegend from './RiskLegend';
import CardsGrid from './CardsGrid';
import DataTable from './DataTable';
import Header from './Header';
import { BitcoinMark } from './icons/BitcoinMark';
import { StacksMark } from './icons/StacksMark';
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

  const liveProtocols = protocols.filter(p => p.status !== 'coming-soon');
  const liveCount = liveProtocols.filter(p => !p.scoresEstimated).length;
  const totalCount = liveProtocols.length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header lastUpdated={lastUpdated} liveCount={liveCount} totalCount={totalCount} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1 tracking-tight" style={{ color: 'var(--text)' }}>
            Bitcoin Yield Intelligence
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Risk-adjusted yield opportunities across the Stacks ecosystem — ranked by Opportunity Score, never by APY alone.
          </p>
        </div>

        <StatsBar stats={stats} loading={isLoading} />

        {error && (
          <div className="mb-4 px-4 py-3 font-mono-data text-xs" style={{ background: 'var(--danger-tint)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            LIVE DATA UNAVAILABLE — SHOWING CURATED BASELINE ESTIMATES
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

        <div className="mt-8 pt-6 text-xs text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}>
          <p>Data sourced from DefiLlama and protocol APIs. APY figures are variable and not guaranteed. This is not financial advice.</p>
          <p className="mt-1 font-mono-data">BTC YIELD VISIBILITY · V1</p>
          <div className="flex items-center justify-center gap-2 mt-3 font-mono-data text-[10px] tracking-wide" style={{ color: 'var(--text-faint)' }}>
            <span>POWERED BY</span>
            <BitcoinMark size={14} />
            <span>BITCOIN</span>
            <span style={{ color: 'var(--border-strong)' }}>×</span>
            <StacksMark size={12} color="var(--text-faint)" />
            <span>STACKS</span>
          </div>
        </div>
      </main>
    </div>
  );
}
