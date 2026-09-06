import React, { useEffect, useMemo, useState } from 'react';
import { DealershipData } from './types';
import { loadDealershipData } from './lib/data';
import { scopeDataToPeriod } from './lib/period';
import { useDashboardStore } from './store/useDashboardStore';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { PipelineActionBoard } from './components/PipelineActionBoard';
import { RepLeagueView } from './components/RepLeagueView';
import { FulfilmentView } from './components/FulfilmentView';
import { DecemberSimulator } from './components/DecemberSimulator';
import { ExecutiveBriefing } from './components/ExecutiveBriefing';
import { AlertCircle, Loader2 } from 'lucide-react';

const EmptyPeriod: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs">
    <AlertCircle className="w-7 h-7 text-slate-400 mx-auto" />
    <h2 className="mt-3 text-sm font-bold text-slate-900">No leads in this period</h2>
    <p className="mt-1 text-xs text-slate-500">
      No leads were created in the selected month range. Widen the time filter to see data.
    </p>
  </div>
);

export const App: React.FC = () => {
  const [data, setData] = useState<DealershipData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { currentView, periodStart, periodEnd } = useDashboardStore();

  // All views render from period-scoped data. Branch / source filters are still
  // applied inside each view (some views deliberately show every branch).
  const scopedData = useMemo(
    () =>
      data ? scopeDataToPeriod(data, { start: periodStart, end: periodEnd }) : null,
    [data, periodStart, periodEnd]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const dealershipData = await loadDealershipData();
        setData(dealershipData);
      } catch (err: any) {
        console.error('Error loading dealership data:', err);
        setError(err.message || 'Failed to load dealership dataset');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm w-full text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <h2 className="mt-4 text-base font-bold text-slate-900">Loading DealerPulse Engine</h2>
          <p className="mt-1 text-xs text-slate-500">
            Indexing leads, deliveries, and status-history audit trail...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data || !scopedData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md w-full text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h2 className="mt-4 text-base font-bold text-slate-900">Data Initialization Failed</h2>
          <p className="mt-2 text-xs text-slate-600 bg-red-50 p-3 rounded-md font-mono">
            {error || 'Unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      <Header data={scopedData} fullData={data} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {scopedData.leads.length === 0 ? (
          <EmptyPeriod />
        ) : (
          <>
            {currentView === 'overview' && <OverviewView data={scopedData} />}
            {currentView === 'pipeline' && <PipelineActionBoard data={scopedData} />}
            {currentView === 'reps' && <RepLeagueView data={scopedData} />}
            {currentView === 'fulfilment' && <FulfilmentView data={scopedData} />}
            {/* The replay is inherently a December walk-through — always full data. */}
            {currentView === 'simulator' && <DecemberSimulator data={data} />}
            {currentView === 'briefing' && <ExecutiveBriefing data={scopedData} />}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DealerPulse v1.0 · Toyota Dealership Group India Operational Intelligence</span>
          <span>Data As Of: 31 Dec 2025, 19:10 UTC · Confidential Executive Platform</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
