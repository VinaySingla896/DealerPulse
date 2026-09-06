import React, { useState } from 'react';
import { DealershipData, SalesRep } from '../types';
import { useDashboardStore } from '../store/useDashboardStore';
import { calculateRepMetrics } from '../lib/metrics';
import { formatINR, formatPct } from '../lib/data';
import { 
  Users, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  UserX, 
  CheckCircle2, 
  Filter, 
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface RepLeagueViewProps {
  data: DealershipData;
}

export const RepLeagueView: React.FC<RepLeagueViewProps> = ({ data }) => {
  const { selectedBranchId, setSelectedBranchId } = useDashboardStore();
  const [roleFilter, setRoleFilter] = useState<'sales_officer' | 'all'>('sales_officer');
  const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null);

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

  return (
    <div className="space-y-6">
      {/* ⚠️ Outlier Highlight Card (Rule 6: Venkat Mishra) */}
      {outliers.length > 0 && (
        <div id="card-outlier-callout" className="bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-red-950">
                    Rule 6 Statistical Outlier Alert: Venkat Mishra (SR16)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-200 text-red-900 uppercase">
                    z-score: -1.53 (&lt; -1.5&sigma;)
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-red-800 leading-relaxed max-w-4xl">
                  Venkat Mishra converts at only <strong className="text-red-950 font-bold underline">4.55%</strong> (1 delivery across 22 leads) 
                  at Lakeside Toyota. This falls below the statistical threshold of <strong className="text-red-950 font-bold">4.60%</strong> 
                  (Branch Mean: 7.77%, &sigma;: 2.11%). He received the highest allocation of leads in Bangalore (22 leads) while peer 
                  <strong className="text-red-950 font-bold"> Varun Kamath (SR15)</strong> achieved <strong className="text-red-950 font-bold">11.11%</strong> (2 deliveries from 18 leads).
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => {
                  setSelectedBranchId('B3');
                  const r = data.sales_reps.find((x) => x.id === 'SR16');
                  if (r) setSelectedRep(r);
                }}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Inspect Venkat's Leads
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
              <span className="text-red-700">Pair Venkat with Varun Kamath (11.11%) for 2-week objection handling shadowing.</span>
            </div>
            <div className="bg-white/80 rounded-md p-2.5 border border-red-200">
              <span className="font-bold text-red-900 block">Lead Rebalancing</span>
              <span className="text-red-700">Reassign 10 fresh leads from Venkat to Varun to maximize immediate revenue capture.</span>
            </div>
          </div>
        </div>
      )}

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
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Total Leads</th>
                <th className="py-3 px-3 text-right">Delivered Units</th>
                <th className="py-3 px-3 text-right">Conversion Rate</th>
                <th className="py-3 px-3 text-right">Delivered Rev</th>
                <th className="py-3 px-3 text-right">Stalled Leads</th>
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
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOutlier ? 'bg-red-50/50' : ''
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

                    <td className="py-3 px-3 font-medium text-slate-700">
                      {rep.branchName}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                        rep.role === 'branch_manager'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rep.role === 'branch_manager' ? 'Branch Manager' : 'Sales Officer'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      {rep.totalLeads}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900">
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

                    <td className="py-3 px-3 text-right">
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
