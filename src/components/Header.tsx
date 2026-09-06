import React from 'react';
import { useDashboardStore, DashboardView } from '../store/useDashboardStore';
import { ALL_MONTHS, MONTH_LABELS, periodLabel } from '../lib/period';
import {
  calculatePipelineHealth,
  calculateDeliveryBottlenecks,
  calculateRepMetrics,
  calculateBranchMetrics,
  calculateSourceMetrics,
  countEventsInMonth,
} from '../lib/metrics';
import { formatINR } from '../lib/data';
import { DealershipData } from '../types';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Truck,
  PlayCircle,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  /** period-scoped data — badge counts follow the active time filter */
  data: DealershipData;
  /** full, unscoped dataset — for the branch selector and the always-December replay badge */
  fullData: DealershipData;
}

export const Header: React.FC<HeaderProps> = ({ data, fullData }) => {
  const allBranches = fullData.branches;
  const {
    currentView,
    setCurrentView,
    selectedBranchId,
    setSelectedBranchId,
    selectedSource,
    setSelectedSource,
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
    resetFilters,
  } = useDashboardStore();

  const firstMonth = ALL_MONTHS[0];
  const lastMonth = ALL_MONTHS[ALL_MONTHS.length - 1];
  const filtersActive =
    selectedBranchId !== 'all' ||
    selectedSource !== 'all' ||
    periodStart !== null ||
    periodEnd !== null;

  // Badge counts derived from the (scoped) data
  const health = calculatePipelineHealth(data.leads);
  const bottlenecks = calculateDeliveryBottlenecks(data.deliveries);
  const outlierCount = calculateRepMetrics(data).filter((r) => r.isOutlier).length;
  // The Dec replay always walks the full December, regardless of the period filter.
  const decEvents = countEventsInMonth(fullData.leads, '2025-12');

  const branchMetrics = calculateBranchMetrics(data);
  const groupMean =
    branchMetrics.length > 0
      ? branchMetrics.reduce((s, b) => s + b.conversionRate, 0) / branchMetrics.length
      : 0;
  const worstBranch = [...branchMetrics].sort((a, b) => a.conversionRate - b.conversionRate)[0];
  const sourceOptions = calculateSourceMetrics(data.leads);

  const navItems: { id: DashboardView; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    {
      id: 'pipeline',
      label: 'Pipeline & Actions',
      icon: <Clock className="w-4 h-4" />,
      badge: `${health.combinedIdleCount} Stalled`,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'reps',
      label: 'Rep League',
      icon: <Users className="w-4 h-4" />,
      badge: outlierCount > 0 ? `${outlierCount} Outlier${outlierCount > 1 ? 's' : ''}` : undefined,
      badgeColor: 'bg-red-100 text-red-800'
    },
    {
      id: 'fulfilment',
      label: 'Fulfilment & Delays',
      icon: <Truck className="w-4 h-4" />,
      badge: `${bottlenecks.delayedCount} Delayed`,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'simulator',
      label: 'Dec Replay',
      icon: <PlayCircle className="w-4 h-4" />,
      badge: `${decEvents} Events`,
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'briefing',
      label: 'CEO Briefing',
      icon: <FileText className="w-4 h-4" />
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Brand, Context, and Emergency Fast Triggers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-xs text-white font-bold tracking-wider text-sm">
              DP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">DealerPulse</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                  Toyota Group India
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {allBranches.length} Branches · {data.sales_reps.length} Reps
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Executive Leadership & Operational Decision Cockpit
              </p>
            </div>
          </div>

          {/* Data Freshness Indicator & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              <span>As of: 31 Dec 2025, 19:10 UTC</span>
            </div>

            <div
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700"
              title="Active time-period scope"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <span>{periodLabel({ start: periodStart, end: periodEnd })}</span>
            </div>

            {/* Quick Audit Triggers */}
            {worstBranch && worstBranch.conversionRate < groupMean * 0.6 && (
              <button
                id="btn-quick-lakeside"
                onClick={() => {
                  setSelectedBranchId(worstBranch.branchId);
                  setCurrentView('overview');
                }}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                title={`Filter directly to ${worstBranch.branchName} crisis audit`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />
                {worstBranch.branchName.replace(' Toyota', '')} Crisis
              </button>
            )}

            <button
              id="btn-quick-stalled"
              onClick={() => {
                setSelectedBranchId('all');
                setCurrentView('pipeline');
              }}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
              {formatINR(health.combinedIdleValue)} Stalled
            </button>
          </div>
        </div>

        {/* Navigation Tabs and Global Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2 gap-3">
          {/* Main Navigation */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentView(item.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Global Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center text-slate-500 font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Filters:</span>
            </div>

            {/* Time-period (month range) Selector */}
            <div className="flex items-center gap-1" title="Slice all views to a range of monthly lead cohorts">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="filter-period-start"
                aria-label="Period start month"
                value={periodStart ?? firstMonth}
                onChange={(e) =>
                  setPeriodStart(e.target.value === firstMonth ? null : e.target.value)
                }
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
              >
                {ALL_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_LABELS[m]}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">→</span>
              <select
                id="filter-period-end"
                aria-label="Period end month"
                value={periodEnd ?? lastMonth}
                onChange={(e) =>
                  setPeriodEnd(e.target.value === lastMonth ? null : e.target.value)
                }
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
              >
                {ALL_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selector */}
            <select
              id="filter-branch-select"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
            >
              <option value="all">All Branches ({allBranches.length})</option>
              {allBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>

            {/* Source Selector */}
            <select
              id="filter-source-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
            >
              <option value="all">All Sources ({sourceOptions.length})</option>
              {sourceOptions.map((s) => (
                <option key={s.source} value={s.source}>
                  {s.source.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} (
                  {Math.round(s.conversionRate * 1000) / 10}% conv)
                </option>
              ))}
            </select>

            {filtersActive && (
              <button
                id="btn-reset-filters"
                onClick={resetFilters}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Reset all filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
