import React from 'react';
import { DealershipData, BranchForecast } from '../types';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  calculateBranchForecast,
  calculateGroupTargetSummary,
  calculateMonthlyTrend,
} from '../lib/metrics';
import { formatINR, formatPct } from '../lib/data';
import { isFullPeriod, periodLabel } from '../lib/period';
import { DeliveriesVsTargetChart, ProjectedAttainmentChart } from './charts';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface TargetForecastViewProps {
  data: DealershipData;
}

const STATUS_META: Record<
  BranchForecast['status'],
  { label: string; badge: string; bar: string; icon: React.ReactNode }
> = {
  ahead: {
    label: 'Ahead of group pace',
    badge: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  on_track: {
    label: 'At group pace',
    badge: 'bg-blue-100 text-blue-800',
    bar: 'bg-blue-500',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  behind: {
    label: 'Behind group pace',
    badge: 'bg-amber-100 text-amber-900',
    bar: 'bg-amber-500',
    icon: <TrendingDown className="w-3.5 h-3.5" />,
  },
  at_risk: {
    label: 'Well behind pace',
    badge: 'bg-red-100 text-red-800',
    bar: 'bg-red-500',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

export const TargetForecastView: React.FC<TargetForecastViewProps> = ({ data }) => {
  const { periodStart, periodEnd, setSelectedBranchId, setCurrentView } = useDashboardStore();
  const period = { start: periodStart, end: periodEnd };

  const forecasts = calculateBranchForecast(data).sort((a, b) => a.vsGroupPace - b.vsGroupPace);
  const group = calculateGroupTargetSummary(data);
  const monthlyTrend = calculateMonthlyTrend(data);
  const expectedAdditionalUnits = forecasts.reduce((s, f) => s + f.expectedAdditionalUnits, 0);

  const worst = forecasts[0];
  const behindCount = forecasts.filter((f) => f.status === 'behind' || f.status === 'at_risk').length;
  const horizon = isFullPeriod(period) ? 'Jun–Dec 2025 (full year)' : periodLabel(period);

  return (
    <div className="space-y-6">
      {/* Intro + methodology */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Target Attainment & Pipeline Forecast</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Horizon: {horizon}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 max-w-3xl">
          Attainment compares delivered units against the branch target for the selected period. The
          projection adds a <strong>stage-weighted forecast</strong> of the open pipeline
          (order&nbsp;placed 90%, negotiation 60%, test&nbsp;drive 40%, contacted 20%, new 10%) to
          estimate where each branch lands if it closes at historical stage odds. Branch status is
          graded <strong>relative to the group's own pace</strong>.
        </p>
      </div>

      {/* Group headline */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Group Target (units)</span>
          <div className="mt-1 text-2xl font-black text-slate-900">{group.targetUnits}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {formatINR(group.targetRevenue)} revenue target
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Delivered / Attainment</span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {group.deliveredUnits}{' '}
            <span className={`text-sm font-bold ${group.attainmentPct >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
              ({formatPct(group.attainmentPct)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{formatINR(group.deliveredRevenue)} delivered</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Projected (delivered + pipeline)</span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {Math.round(group.projectedUnits)}{' '}
            <span
              className={`text-sm font-bold ${
                group.projectedAttainmentPct >= 1 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              ({formatPct(group.projectedAttainmentPct)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            +{expectedAdditionalUnits.toFixed(1)} expected from open pipeline
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Lead-supply gap</span>
          <div className="mt-1 text-2xl font-black text-red-700">
            {Math.round(group.leadSupplyGap).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {group.leadsReceived} leads in vs ~{Math.round(group.leadsNeededForTarget).toLocaleString('en-IN')}{' '}
            needed at {formatPct(group.groupConversion)} close rate
          </p>
        </div>
      </div>

      {/* Structural insight — why the whole group trails target */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block text-amber-950">
            The group is tracking at {formatPct(group.projectedAttainmentPct)} of target — this is a
            demand-generation gap, not a closing gap
          </span>
          <p className="mt-1 leading-relaxed">
            Targets total <strong>{group.targetUnits.toLocaleString('en-IN')} units</strong> for {horizon}, but only{' '}
            <strong>{group.leadsReceived.toLocaleString('en-IN')} leads</strong> were generated. Hitting target at the
            current <strong>{formatPct(group.groupConversion)}</strong> lead-to-delivery rate would require{' '}
            <strong>~{Math.round(group.leadsNeededForTarget).toLocaleString('en-IN')} leads</strong> — a{' '}
            <strong>{Math.round(group.leadSupplyGap).toLocaleString('en-IN')}-lead shortfall</strong>. The CEO levers
            are marketing spend / walk-in generation and lifting the contact + test-drive conversion rate, not
            just rep coaching.
          </p>
        </div>
      </div>

      {/* Relative-pace laggard callout */}
      {worst && (worst.status === 'behind' || worst.status === 'at_risk') && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-start space-x-3">
          <TrendingDown className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block text-red-950">
              {worst.branchName} is running at {formatPct(worst.vsGroupPace)} of the group's pace —{' '}
              {formatPct(worst.projectedAttainmentPct)} projected vs {formatPct(group.projectedAttainmentPct)} group
            </span>
            <p className="mt-1 leading-relaxed">
              {worst.branchName} has delivered {worst.deliveredUnits} of {worst.targetUnits} target units (
              {formatPct(worst.attainmentUnitsPct)}). Even closing its {worst.openLeadsCount} open leads at
              historical stage odds adds only ~{worst.expectedAdditionalUnits.toFixed(1)} units.
              {behindCount > 1 && ` ${behindCount} branches are lagging the group pace.`}
            </p>
            <button
              onClick={() => {
                setSelectedBranchId(worst.branchId);
                setCurrentView('reps');
              }}
              className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Inspect {worst.branchName} reps <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Charts: monthly delivered vs target + projected attainment by branch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Delivered vs Target by Month</h3>
          <p className="text-xs text-slate-500 mb-3">Group units delivered against the summed monthly target</p>
          {monthlyTrend.length > 1 ? (
            <DeliveriesVsTargetChart data={monthlyTrend} />
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              Select a wider time range to see the monthly comparison.
            </p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Projected Attainment by Branch</h3>
          <p className="text-xs text-slate-500 mb-3">
            Delivered (blue) + expected pipeline (amber) as % of target
          </p>
          <ProjectedAttainmentChart data={forecasts} />
        </div>
      </div>

      {/* Per-branch attainment table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Branch Target Attainment</h3>
          <p className="text-xs text-slate-500">
            Ranked by pace vs the group · bar shows delivered (solid) + expected pipeline (hatched) vs target
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-3 text-right hidden md:table-cell">Target</th>
                <th className="py-3 px-3 text-right hidden md:table-cell">Delivered</th>
                <th className="py-3 px-3 text-right">Attainment</th>
                <th className="py-3 px-3 w-48 hidden lg:table-cell">Progress vs Target</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">Open Pipe</th>
                <th className="py-3 px-3 text-right">Projected</th>
                <th className="py-3 px-3 text-right hidden md:table-cell">vs Group Pace</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecasts.map((f) => {
                const meta = STATUS_META[f.status];
                const deliveredPct = f.targetUnits > 0 ? Math.min(1, f.deliveredUnits / f.targetUnits) : 0;
                const expectedPct =
                  f.targetUnits > 0
                    ? Math.min(1 - deliveredPct, f.expectedAdditionalUnits / f.targetUnits)
                    : 0;
                return (
                  <tr key={f.branchId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{f.branchName}</span>
                      <span className="text-[11px] text-slate-500">{f.city}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 hidden md:table-cell">{f.targetUnits}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 hidden md:table-cell">{f.deliveredUnits}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-black ${
                          f.attainmentUnitsPct >= 1 ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {formatPct(f.attainmentUnitsPct)}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                        <div className={`h-full ${meta.bar}`} style={{ width: `${deliveredPct * 100}%` }} />
                        <div
                          className={`h-full ${meta.bar} opacity-40`}
                          style={{ width: `${expectedPct * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 hidden lg:table-cell">
                      {formatINR(f.openPipelineValue)}
                      <span className="block text-[10px] text-slate-400">{f.openLeadsCount} leads</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-900">{Math.round(f.projectedUnits)}</span>
                      <span className="block text-[10px] text-slate-400">
                        {formatPct(f.projectedAttainmentPct)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold hidden md:table-cell">
                      <span className={f.vsGroupPace >= 0.9 ? 'text-emerald-700' : 'text-red-700'}>
                        {formatPct(f.vsGroupPace)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badge}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
