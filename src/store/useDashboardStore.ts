import { create } from 'zustand';
import { LeadSource, LeadModel } from '../types';

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
  selectedModel: string; // 'all' or LeadModel
  selectedRepId: string; // 'all' or 'SR16', etc.
  
  // Simulator State
  simulatorDay: number; // 1 to 31 (December 2025)
  isSimulating: boolean;

  // Actions
  setCurrentView: (view: DashboardView) => void;
  setSelectedBranchId: (branchId: string) => void;
  setSelectedSource: (source: string) => void;
  setSelectedModel: (model: string) => void;
  setSelectedRepId: (repId: string) => void;
  setSimulatorDay: (day: number) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentView: 'overview',
  selectedBranchId: 'all',
  selectedSource: 'all',
  selectedModel: 'all',
  selectedRepId: 'all',

  simulatorDay: 31,
  isSimulating: false,

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedRepId: (repId) => set({ selectedRepId: repId }),
  setSimulatorDay: (day) => set({ simulatorDay: day }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  resetFilters: () =>
    set({
      selectedBranchId: 'all',
      selectedSource: 'all',
      selectedModel: 'all',
      selectedRepId: 'all',
    }),
}));
