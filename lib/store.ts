'use client';

import { create } from 'zustand';
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

export const useDashboardStore = create<DashboardState>((set) => ({
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
    if (next.has(metric)) {
      next.delete(metric);
    } else {
      next.add(metric);
    }
    return { visibleMetrics: next };
  }),
}));
