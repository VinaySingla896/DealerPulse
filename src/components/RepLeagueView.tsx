import React, { useState } from 'react';
import { DealershipData, SalesRep } from '../types';
import { useDashboardStore } from '../store/useDashboardStore';
import { calculateRepMetrics } from '../lib/metrics';
import { formatINR, formatPct, calculateIdleDays, displayLostReason } from '../lib/data';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  X
} from 'lucide-react';

interface RepLeagueViewProps {
  data: DealershipData;
}

export const RepLeagueView: React.FC<RepLeagueViewProps> = ({ data }) => {
  const { selectedBranchId, setSelectedBranchId } = useDashboardStore();
  const [roleFilter, setRoleFilter] = useState<'sales_officer' | 'all'>('sales_officer');
  const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const repMetrics = calculateRepMetrics(data, selectedBranchId);

  // Filter based on role
  const displayReps = repMetrics.filter((r) => {
    if (roleFilter === 'sales_officer' && r.role !== 'sales_officer') return false;
    return true;
  });

  // Outliers (Rule 6)
  const outliers = repMetrics.filter((r) => r.isOutlier);

  // Group by performance tier
  const sortedReps = [...displayReps].sort((a, b) => b.conversionRate - a.conversionRate);

  // Rep-level drill-down: every lead assigned to the selected rep, within the current period scope
  const repLeads = selectedRep
    ? data.leads
        .filter((l) => l.assigned_to === selectedRep.id)
        .sort((a, b) => b.deal_value - a.deal_value)
    : [];
  const selectedRepMetric = selectedRep
    ? repMetrics.find((r) => r.repId === selectedRep.id)
    : undefined;

  return (
    <div className="space-y-6">
      {selectedRep && (
        <div className="bg-white border-2 border-slate-300 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-3 px-5 py-4 bg-slate-900 text-white">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                {selectedRep.name}
                <span className="text-[10px] font-medium text-slate-300">{selectedRep.id}</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {selectedRepMetric?.branchName} ·{' '}
                {selectedRep.role === 'branch_manager' ? 'Branch Manager' : 'Sales Officer'} ·{' '}
                {repLeads.length} leads ·{' '}
                {selectedRepMetric ? formatPct(selectedRepMetric.conversionRate) : '—'} conversion ·{' '}
                {selectedRepMetric ? formatINR(selectedRepMetric.deliveredRevenue) : '—'} delivered
              </p>
            </div>
            <button
              onClick={() => setSelectedRep(null)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close rep detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {repLeads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No leads assigned to this rep in the selected period.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Model</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Idle Days</th>
                    <th className="py-2.5 px-3 text-right">Deal Value</th>
                    <th className="py-2.5 px-4 hidden md:table-cell">Latest Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repLeads.map((l) => {
                    const idle = calculateIdleDays(l.last_activity_at);
                    const isExpanded = expandedLead === l.id;
                    return (
                      <React.Fragment key={l.id}>
                        <tr
                          onClick={() => setExpandedLead(isExpanded ? null : l.id)}
                          className={`cursor-pointer hover:bg-slate-50/80 ${isExpanded ? 'bg-slate-50' : ''}`}
                          title="Show full lead journey"
                        >
                          <td className="py-2 px-4 font-semibold text-slate-900">
                            <span className="inline-flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              )}
                              {l.customer_name}
                            </span>
                          </td>
                          <td className="py-2 px-3 hidden sm:table-cell">{l.model_interested}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {l.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {l.status === 'delivered' || l.status === 'lost' ? '—' : `${idle.toFixed(0)}d`}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatINR(l.deal_value)}
                          </td>
                          <td className="py-2 px-4 max-w-xs truncate text-[11px] text-slate-500 hidden md:table-cell">
                            {l.status === 'lost'
                              ? displayLostReason(l.lost_reason)
                              : l.status_history[l.status_history.length - 1]?.note || '—'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                                Lead journey · {l.id} · created {format(new Date(l.created_at), 'd MMM yyyy')}
                                {l.expected_close_date &&
                                  ` · expected close ${format(new Date(l.expected_close_date), 'd MMM yyyy')}`}
                              </div>
                              <ol className="relative border-l border-slate-300 ml-1.5 space-y-3">
                                {l.status_history.map((h, i) => (
                                  <li key={i} className="ml-4">
                                    <span className="absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full bg-slate-400" />
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                      <span className="font-bold text-slate-800 capitalize">
                                        {h.status.replace('_', ' ')}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {format(new Date(h.timestamp), 'd MMM yyyy, HH:mm')}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">{h.note}</p>
                                  </li>
                                ))}
                              </ol>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ⚠️ Outlier Highlight Card (Rule 6: statistical under-performers) */}
      {outliers.length > 0 && (() => {
        const worst = [...outliers].sort((a, b) => a.zScore - b.zScore)[0];
        const peers = repMetrics
          .filter((r) => r.branchId === worst.branchId && r.role === 'sales_officer' && !r.isOutlier)
          .sort((a, b) => b.conversionRate - a.conversionRate);
        const topPeer = peers[0];
        return (
        <div id="card-outlier-callout" className="bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-red-950">
                    Rule 6 Statistical Outlier Alert: {worst.repName} ({worst.repId})
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-200 text-red-900 uppercase">
                    z-score: {worst.zScore.toFixed(2)} (&lt; -1.5&sigma;)
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-red-800 leading-relaxed max-w-4xl">
                  {worst.repName} converts at only <strong className="text-red-950 font-bold underline">{formatPct(worst.conversionRate)}</strong>{' '}
                  ({worst.deliveredUnits} {worst.deliveredUnits === 1 ? 'delivery' : 'deliveries'} across {worst.totalLeads} leads)
                  at {worst.branchName}, more than 1.5 standard deviations below the branch mean.
                  {topPeer && (
                    <> Peer <strong className="text-red-950 font-bold">{topPeer.repName} ({topPeer.repId})</strong> achieved{' '}
                    <strong className="text-red-950 font-bold">{formatPct(topPeer.conversionRate)}</strong>{' '}
                    ({topPeer.deliveredUnits} from {topPeer.totalLeads}) on comparable volume.</>
                  )}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => {
                  setSelectedBranchId(worst.branchId);
                  const r = data.sales_reps.find((x) => x.id === worst.repId);
                  if (r) setSelectedRep(r);
                }}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Inspect {worst.repName.split(' ')[0]}'s Leads
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
              <span className="font-bold text-red-900 block">Root Cause Diagnosis</span>
              <span className="text-red-700">High initial lead volume, delayed first contact (&gt;48 hrs), poor test-drive conversion.</span>
            </div>
            <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
              <span className="font-bold text-red-900 block">Recommended Action</span>
              <span className="text-red-700">
                Pair {worst.repName.split(' ')[0]}
                {topPeer ? ` with ${topPeer.repName.split(' ')[0]} (${formatPct(topPeer.conversionRate)})` : ''} for a 2-week objection-handling shadow.
              </span>
            </div>
            <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
              <span className="font-bold text-red-900 block">Lead Rebalancing</span>
              <span className="text-red-700">
                Reassign fresh leads from {worst.repName.split(' ')[0]}
                {topPeer ? ` to ${topPeer.repName.split(' ')[0]}` : ' to a top peer'} to maximize immediate revenue capture.
              </span>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Controls & Trap 5 Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Sales Representative League Table</h3>
          <p className="text-xs text-slate-500">
            Conversion performance indexed by branch mean and statistical variance
          </p>
        </div>

        {/* Role Toggle (Trap 5: Exclude branch managers from rep ranking) */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Role Filter:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
            <button
              onClick={() => setRoleFilter('sales_officer')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                roleFilter === 'sales_officer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Officers Only (25)
            </button>
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Staff (30)
            </button>
          </div>
        </div>
      </div>

      {/* Rep League Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank & Rep Name</th>
                <th className="py-3 px-3 hidden md:table-cell">Branch</th>
                <th className="py-3 px-3 hidden lg:table-cell">Role</th>
                <th className="py-3 px-3 text-right hidden md:table-cell">Total Leads</th>
                <th className="py-3 px-3 text-right hidden md:table-cell">Delivered Units</th>
                <th className="py-3 px-3 text-right">Conversion Rate</th>
                <th className="py-3 px-3 text-right">Delivered Rev</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">Stalled Leads</th>
                <th className="py-3 px-4 text-center">Status / Outlier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedReps.map((rep, idx) => {
                const isOutlier = rep.isOutlier;
                const isTopPerformer = rep.conversionRate >= 0.40;
                const isZeroLeadManager = rep.totalLeads === 0;

                return (
                  <tr
                    key={rep.repId}
                    onClick={() => {
                      const r = data.sales_reps.find((x) => x.id === rep.repId);
                      setSelectedRep(r ?? null);
                    }}
                    title="View this rep's leads"
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                      selectedRep?.id === rep.repId ? 'bg-slate-100' : isOutlier ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isTopPerformer
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOutlier
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{rep.repName}</span>
                          <span className="text-[10px] text-slate-500">{rep.repId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700 hidden md:table-cell">
                      {rep.branchName}
                    </td>

                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                        rep.role === 'branch_manager'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rep.role === 'branch_manager' ? 'Branch Manager' : 'Sales Officer'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-900 hidden md:table-cell">
                      {rep.totalLeads}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900 hidden md:table-cell">
                      {rep.deliveredUnits}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isZeroLeadManager ? (
                        <span className="text-slate-400 font-medium">N/A (Manager)</span>
                      ) : (
                        <span className={`font-black text-xs ${
                          isTopPerformer
                            ? 'text-emerald-700'
                            : isOutlier
                            ? 'text-red-700 text-sm'
                            : 'text-slate-900'
                        }`}>
                          {formatPct(rep.conversionRate)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatINR(rep.deliveredRevenue)}
                    </td>

                    <td className="py-3 px-3 text-right hidden lg:table-cell">
                      {rep.stalledLeadsCount > 0 ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-900 font-bold text-[11px]">
                          {rep.stalledLeadsCount} stalled
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isOutlier ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Outlier (-1.5&sigma;)
                        </span>
                      ) : isTopPerformer ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Award className="w-3 h-3 mr-1" />
                          Top Tier
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">On Standard</span>
                      )}
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
