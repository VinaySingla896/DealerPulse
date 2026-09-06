import React from 'react';
import { useDashboardStore, DashboardView } from '../store/useDashboardStore';
import { DATA_AS_OF_STRING } from '../lib/data';
import { Branch } from '../types';
import { 
  Building2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  Truck, 
  PlayCircle, 
  FileText, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface HeaderProps {
  branches: Branch[];
}

export const Header: React.FC<HeaderProps> = ({ branches }) => {
  const {
    currentView,
    setCurrentView,
    selectedBranchId,
    setSelectedBranchId,
    selectedSource,
    setSelectedSource,
    resetFilters,
  } = useDashboardStore();

  const navItems: { id: DashboardView; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { 
      id: 'pipeline', 
      label: 'Pipeline & Actions', 
      icon: <Clock className="w-4 h-4" />, 
      badge: '39 Stalled', 
      badgeColor: 'bg-amber-100 text-amber-800' 
    },
    { 
      id: 'reps', 
      label: 'Rep League', 
      icon: <Users className="w-4 h-4" />,
      badge: '1 Outlier',
      badgeColor: 'bg-red-100 text-red-800'
    },
    { 
      id: 'fulfilment', 
      label: 'Fulfilment & Delays', 
      icon: <Truck className="w-4 h-4" />,
      badge: '72 Delayed',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'simulator', 
      label: 'Dec Replay', 
      icon: <PlayCircle className="w-4 h-4" />,
      badge: '343 Events',
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
                  5 Branches · 30 Reps
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

            {/* Quick Audit Triggers */}
            <button
              id="btn-quick-lakeside"
              onClick={() => {
                setSelectedBranchId('B3');
                setCurrentView('overview');
              }}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              title="Filter directly to Lakeside Toyota crisis audit"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />
              Lakeside Crisis
            </button>

            <button
              id="btn-quick-stalled"
              onClick={() => {
                setSelectedBranchId('all');
                setCurrentView('pipeline');
              }}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
              ₹9.16 Cr Stalled
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
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center text-slate-500 font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Filters:</span>
            </div>

            {/* Branch Selector */}
            <select
              id="filter-branch-select"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
            >
              <option value="all">All Branches (5)</option>
              {branches.map((b) => (
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
              <option value="all">All Sources (6)</option>
              <option value="walk_in">Walk-in (45.7% conv)</option>
              <option value="auto_expo">Auto Expo (30.2% conv)</option>
              <option value="referral">Referral (30.1% conv)</option>
              <option value="website">Website (28.0% conv)</option>
              <option value="phone_enquiry">Phone Enquiry (27.8% conv)</option>
              <option value="social_media">Social Media (13.9% conv)</option>
            </select>

            {(selectedBranchId !== 'all' || selectedSource !== 'all') && (
              <button
                id="btn-reset-filters"
                onClick={resetFilters}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Reset filters"
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
