import { create } from 'zustand';

export type DashboardView =
  | 'overview'
  | 'pipeline'
  | 'reps'
  | 'fulfilment'
  | 'simulator'
  | 'briefing';

interface DashboardState {
  currentView: DashboardView;
  selectedBranchId: string; // 'all' or 'B1', 'B2', etc.
  selectedSource: string; // 'all' or LeadSource

  // Time-period filter (month cohort range). null = unbounded on that side.
  periodStart: string | null; // e.g. '2025-06'
  periodEnd: string | null; // e.g. '2025-12'

  // Simulator State
  simulatorDay: number; // 1 to 31 (December 2025)
  isSimulating: boolean;

  // Actions
  setCurrentView: (view: DashboardView) => void;
  setSelectedBranchId: (branchId: string) => void;
  setSelectedSource: (source: string) => void;
  setPeriodStart: (month: string | null) => void;
  setPeriodEnd: (month: string | null) => void;
  setSimulatorDay: (day: number) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentView: 'overview',
  selectedBranchId: 'all',
  selectedSource: 'all',

  periodStart: null,
  periodEnd: null,

  simulatorDay: 31,
  isSimulating: false,

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setPeriodStart: (month) =>
    set((s) => {
      const periodStart = month;
      // keep the range coherent: end must not precede start
      const periodEnd =
        periodStart && s.periodEnd && s.periodEnd < periodStart ? periodStart : s.periodEnd;
      return { periodStart, periodEnd };
    }),
  setPeriodEnd: (month) =>
    set((s) => {
      const periodEnd = month;
      const periodStart =
        periodEnd && s.periodStart && s.periodStart > periodEnd ? periodEnd : s.periodStart;
      return { periodEnd, periodStart };
    }),
  setSimulatorDay: (day) => set({ simulatorDay: day }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  resetFilters: () =>
    set({
      selectedBranchId: 'all',
      selectedSource: 'all',
      periodStart: null,
      periodEnd: null,
    }),
}));
