import React from 'react';
import { DealershipData } from '../types';
import { useDashboardStore } from '../store/useDashboardStore';
import { 
  calculateFunnelMetrics, 
  calculateBranchMetrics, 
  calculateSourceMetrics, 
  calculatePipelineHealth 
} from '../lib/metrics';
import { formatINR, formatPct } from '../lib/data';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';

interface OverviewViewProps {
  data: DealershipData;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ data }) => {
  const { 
    selectedBranchId, 
    setSelectedBranchId, 
    setCurrentView,
    selectedSource 
  } = useDashboardStore();

  // Filter leads based on selected branch and source
  const filteredLeads = data.leads.filter((lead) => {
    if (selectedBranchId !== 'all' && lead.branch_id !== selectedBranchId) return false;
    if (selectedSource !== 'all' && lead.source !== selectedSource) return false;
    return true;
  });

  const funnel = calculateFunnelMetrics(filteredLeads);
  const branchMetrics = calculateBranchMetrics(data);
  const sourceMetrics = calculateSourceMetrics(filteredLeads);
  const pipelineHealth = calculatePipelineHealth(filteredLeads);

  const lakesideBranch = branchMetrics.find((b) => b.branchId === 'B3');
  const groupMeanConversion = 0.3137; // 31.4%

  return (
    <div className="space-y-6">
      {/* 🚨 Priority 1: Lakeside Crisis Banner (Always prominent on Overview) */}
      <div 
        id="banner-lakeside-alert"
        className="bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-xs transition-all"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-red-950">
                  Critical Finding: Lakeside Toyota (Bangalore) Contact Rate Collapse
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-200 text-red-900 uppercase tracking-wider">
                  Immediate CEO Action Required
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-red-800 leading-relaxed max-w-4xl">
                Lakeside converts at only <strong className="text-red-950 underline font-bold">7.6%</strong> (6 of 79 units) 
                while the group averages <strong className="text-red-950 font-bold">31.4%</strong>. 
                Root cause is <strong className="text-red-950">not closing skill</strong>: 
                <strong className="text-red-950 underline font-bold"> 41.8% of incoming leads (33 leads) were never contacted</strong> 
                (vs 17.5%–22.0% across all other branches). Additionally, rep <strong className="text-red-950">Venkat Mishra (SR16)</strong> converts 
                at only 4.55% with 22 leads assigned.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 shrink-0">
            <button
              id="btn-lakeside-audit-action"
              onClick={() => {
                setSelectedBranchId('B3');
                setCurrentView('reps');
              }}
              className="inline-flex items-center justify-center px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <span>Inspect Rep SR16 & Branch Reps</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
            <button
              id="btn-lakeside-pipeline-action"
              onClick={() => {
                setSelectedBranchId('B3');
                setCurrentView('pipeline');
              }}
              className="inline-flex items-center justify-center px-3 py-2 bg-white hover:bg-red-100 text-red-900 border border-red-300 text-xs font-semibold rounded-lg transition-colors"
            >
              View Lakeside Stalled Leads
            </button>
          </div>
        </div>

        {/* Diagnostic Action Checklist */}
        <div className="mt-4 pt-3 border-t border-red-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
            <span className="font-bold text-red-900 block">1. Enforce 2-Hour Lead SLA</span>
            <span className="text-red-700">Audit BM Anand Kulkarni's intake queue; 33 leads died with zero rep outreach.</span>
          </div>
          <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
            <span className="font-bold text-red-900 block">2. Reassign From SR16</span>
            <span className="text-red-700">Shift 10 active leads from Venkat Mishra (4.55%) to Varun Kamath (11.11%).</span>
          </div>
          <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
            <span className="font-bold text-red-900 block">3. Recoverable Revenue</span>
            <span className="text-red-700">Closing group parity gap unlocks +18 deliveries worth ₹4.38 Cr at Lakeside.</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Delivered Revenue */}
        <div id="kpi-delivered-revenue" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Delivered Revenue</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatINR(funnel.deliveredRevenue)}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {funnel.statusCounts.delivered} vehicles delivered across group
          </p>
        </div>

        {/* Group Conversion Rate */}
        <div id="kpi-group-conversion" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Group Conversion</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatPct(funnel.totalLeads > 0 ? funnel.statusCounts.delivered / funnel.totalLeads : 0)}
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
              Baseline 31.4%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            160 delivered out of {funnel.totalLeads} total leads
          </p>
        </div>

        {/* Stalled Pipeline at Risk */}
        <div 
          id="kpi-stalled-pipeline" 
          onClick={() => setCurrentView('pipeline')}
          className="bg-white border border-amber-300 hover:border-amber-400 rounded-xl p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="text-xs font-medium text-amber-900 flex items-center justify-between">
            <span>Stalled Pipeline (&ge;7d)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
              {formatINR(pipelineHealth.combinedIdleValue)}
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-sm">
              {pipelineHealth.combinedIdleCount} deals
            </span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700">
            ₹7.68 Cr booked orders + ₹1.48 Cr sales leads
          </p>
        </div>

        {/* Never Contacted Leak */}
        <div id="kpi-never-contacted" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Never Contacted</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {funnel.neverContactedCount}
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
              {formatPct(funnel.neverContactedRate)} leak
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Leads dropped without a single touchpoint
          </p>
        </div>

        {/* Fulfilment Delay Rate */}
        <div 
          id="kpi-fulfilment-delay" 
          onClick={() => setCurrentView('fulfilment')}
          className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-xs cursor-pointer transition-colors"
        >
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Fulfilment Delay Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              45.0%
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm">
              72 of 160
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Median delivery 17.0 days; 21 factory/transit
          </p>
        </div>
      </div>

      {/* Branch League Table (Rule 2: Comparison Over Absolutes) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Branch Performance League Table</h3>
            <p className="text-xs text-slate-500">
              Benchmark comparison against group mean conversion (31.4%) and intake contact SLA
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Ranked by overall lead-to-delivery conversion rate
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank & Branch</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3 text-right">Total Leads</th>
                <th className="py-3 px-3 text-right">Delivered</th>
                <th className="py-3 px-3 text-right">Conversion Rate</th>
                <th className="py-3 px-3 text-right">Test Drive Rate</th>
                <th className="py-3 px-3 text-right">Never Contacted</th>
                <th className="py-3 px-3 text-right">Lost Rate</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchMetrics
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .map((b, idx) => {
                  const isCrisis = b.branchId === 'B3';
                  const isLeader = idx === 0;
                  const varianceFromGroup = b.conversionRate - groupMeanConversion;

                  return (
                    <tr
                      key={b.branchId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCrisis ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isLeader 
                              ? 'bg-amber-100 text-amber-800' 
                              : isCrisis 
                              ? 'bg-red-600 text-white' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {b.branchName}
                            </span>
                            {isCrisis && (
                              <span className="text-[10px] font-extrabold text-red-700 uppercase">
                                Severe Crisis
                              </span>
                            )}
                            {isLeader && (
                              <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                Top Efficiency
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-600">
                        {b.city}
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                        {b.totalLeads}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        {b.deliveredUnits}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-black ${isCrisis ? 'text-red-700 text-sm' : 'text-slate-900'}`}>
                            {formatPct(b.conversionRate)}
                          </span>
                          <span className={`text-[10px] font-semibold ${
                            varianceFromGroup >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {varianceFromGroup >= 0 ? '+' : ''}{(varianceFromGroup * 100).toFixed(1)}% vs avg
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        {formatPct(b.testDriveRate)}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-sm font-bold text-xs ${
                          b.neverContactedRate > 0.3
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {formatPct(b.neverContactedRate)} ({b.neverContactedCount})
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-slate-700">
                        {formatPct(b.lostRate)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatINR(b.deliveredRevenue)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedBranchId(b.branchId);
                            if (isCrisis) {
                              setCurrentView('reps');
                            }
                          }}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          Filter
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Section: Funnel Reach & Lead Source Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Reach Diagnostics (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Full Sales Funnel Diagnostics</h3>
              <p className="text-xs text-slate-500">Cumulative reach & stage-by-stage drop-off leaks</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              510 Leads
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {funnel.stages.map((stage, idx) => {
              const widthPct = Math.max(12, Math.round(stage.pctOfTotal * 100));
              const isDropoffWarning = stage.dropoffFromPrevPct > 0.2;

              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{stage.label}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-slate-900">{stage.count} leads</span>
                      <span className="text-slate-500 font-medium w-12 text-right">
                        {formatPct(stage.pctOfTotal)}
                      </span>
                      {idx > 0 && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-sm ${
                          isDropoffWarning ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          -{(stage.dropoffFromPrevPct * 100).toFixed(1)}% leak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx === 0 
                          ? 'bg-slate-700' 
                          : idx === 1 && funnel.neverContactedRate > 0.2
                          ? 'bg-amber-500'
                          : idx === funnel.stages.length - 1
                          ? 'bg-emerald-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <strong className="font-bold block mb-1">🔍 CEO Funnel Takeaway:</strong>
            The biggest single leakage in the group is between <strong className="font-semibold">Lead Created &rarr; Contacted (119 leads, 23.3%)</strong>. 
            Once a customer completes a test drive, conversion to delivery surges to <strong className="font-semibold">53.3%</strong> (160/300).
            The operational priority must be ensuring 100% of leads receive a phone call within 2 hours.
          </div>
        </div>

        {/* Lead Source Quality & Attainment (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lead Source ROI & Quality</h3>
                <p className="text-xs text-slate-500">Conversion efficiency by acquisition channel</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {sourceMetrics.map((sm) => {
                const isHighPerformer = sm.conversionRate >= 0.4;
                const isLowPerformer = sm.conversionRate < 0.2;

                return (
                  <div key={sm.source} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 capitalize">
                          {sm.source.replace('_', ' ')}
                        </span>
                        {isHighPerformer && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                            High Intent
                          </span>
                        )}
                        {isLowPerformer && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1.5 py-0.2 rounded-full">
                            Low ROI
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {sm.deliveredUnits} delivered / {sm.totalLeads} leads
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-black block ${
                        isHighPerformer ? 'text-emerald-700' : isLowPerformer ? 'text-red-700' : 'text-slate-900'
                      }`}>
                        {formatPct(sm.conversionRate)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {formatINR(sm.deliveredRevenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-900">Strategic Allocation:</span> Walk-in leads convert at <strong>45.7%</strong> vs Social Media at <strong>13.9%</strong>. Re-orient marketing spend towards dealer footfall and VIP drive days.
          </div>
        </div>
      </div>
    </div>
  );
};
