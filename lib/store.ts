'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, SortKey } from './types';

interface DashboardState {
  mode: 'simple' | 'advanced';
  category: Category;
  sortKey: SortKey;
  sortDesc: boolean;

  visibleMetrics: Set<string>;

  setMode: (mode: 'simple' | 'advanced') => void;
  setCategory: (cat: Category) => void;
  setSortKey: (key: SortKey) => void;
  toggleSortDir: () => void;
  toggleMetric: (metric: string) => void;
}

const DEFAULT_METRICS = new Set([
  'tvlUsd', 'riskScore', 'healthScore', 'opportunityScore',
  'ilRisk', 'strategy', 'lockupPeriod', 'audited',
]);

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      mode: 'simple',
      category: 'All',
      sortKey: 'opportunityScore',
      sortDesc: true,
      visibleMetrics: DEFAULT_METRICS,

      setMode: (mode) => set({ mode }),
      setCategory: (category) => set({ category }),
      setSortKey: (key) => set((s) => ({
        sortKey: key,
        sortDesc: s.sortKey === key ? !s.sortDesc : true,
      })),
      toggleSortDir: () => set((s) => ({ sortDesc: !s.sortDesc })),
      toggleMetric: (metric) => set((s) => {
        const next = new Set(s.visibleMetrics);
        if (next.has(metric)) next.delete(metric);
        else next.add(metric);
        return { visibleMetrics: next };
      }),
    }),
    {
      name: 'btcfi-dashboard-v1',
      // Set isn't JSON-serializable — store it as an array, rebuild on load.
      partialize: (s) => ({
        mode: s.mode,
        category: s.category,
        sortKey: s.sortKey,
        sortDesc: s.sortDesc,
        visibleMetrics: [...s.visibleMetrics],
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DashboardState> & { visibleMetrics?: string[] };
        return {
          ...current,
          ...p,
          visibleMetrics: p.visibleMetrics ? new Set(p.visibleMetrics) : current.visibleMetrics,
        };
      },
    }
  )
);
