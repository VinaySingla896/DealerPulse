import React from 'react';
import { DealershipData } from '../types';
import {
  calculateBranchMetrics,
  calculatePipelineHealth,
  calculateFunnelMetrics,
  calculateDeliveryBottlenecks,
  deriveGroupHeadlines,
} from '../lib/metrics';
import { formatINR, formatPct } from '../lib/data';
import { isFullPeriod, periodLabel } from '../lib/period';
import { useDashboardStore } from '../store/useDashboardStore';
import { 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Building2, 
  FileText,
  PhoneCall,
  Truck
} from 'lucide-react';

interface ExecutiveBriefingProps {
  data: DealershipData;
}

export const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({ data }) => {
  const branchMetrics = calculateBranchMetrics(data);
  const funnel = calculateFunnelMetrics(data.leads);
  const health = calculatePipelineHealth(data.leads);
  const bottlenecks = calculateDeliveryBottlenecks(data.deliveries);
  const hl = deriveGroupHeadlines(data);

  const { periodStart, periodEnd } = useDashboardStore();
  const period = { start: periodStart, end: periodEnd };
  const fullYear = isFullPeriod(period);

  const worst = hl.worstBranch;
  const worstBM = worst
    ? data.sales_reps.find((r) => r.branch_id === worst.branchId && r.role === 'branch_manager')
    : undefined;
  const ranked = [...branchMetrics].sort((a, b) => b.conversionRate - a.conversionRate);
  const strong = ranked.slice(0, 2);

  // CRM data-integrity traps
  const trap6Count = data.leads.filter(
    (l) =>
      l.lost_reason === 'Dissatisfied with test drive' &&
      !l.status_history.some((h) => h.status === 'test_drive')
  ).length;
  const trap4Count = data.leads.filter((l) => l.status === 'lost' && l.lost_reason === null).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Monday Morning CEO Executive Briefing</h2>
          <p className="text-xs text-slate-500">Board-Ready Operational Summary & Immediate Directives</p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {!fullYear && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          <strong>Scoped briefing.</strong> Every figure below is computed for the{' '}
          <strong>{periodLabel(period)}</strong> cohort. Reset the period filter for the full-year board briefing.
        </div>
      )}

      {/* Printable Briefing Document Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600 block">
              Confidential · Group CEO Eyes Only
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              DealerPulse Executive Briefing: {branchMetrics.length}-Branch Group Health
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Data Cut-Off: 31 December 2025, 19:10:00 UTC · Scope: {branchMetrics.length} Branches,{' '}
              {data.sales_reps.length} Sales Staff, {funnel.totalLeads} Leads
              {!fullYear && <> · Period: {periodLabel(period)}</>}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Total Group Revenue</span>
            <span className="text-2xl font-black text-slate-900 block">
              {formatINR(funnel.deliveredRevenue)}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {hl.deliveredUnits} Units Delivered ({formatPct(hl.groupConversion)} Conv)
            </span>
          </div>
        </div>

        {/* Executive 30-Second Bottom Line */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-800 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">Executive Bottom Line:</h3>
          <p className="leading-relaxed">
            Overall group performance is driven by healthy conversion at{' '}
            {strong.map((b, i) => (
              <React.Fragment key={b.branchId}>
                <strong>{b.branchName} ({formatPct(b.conversionRate)})</strong>
                {i === 0 ? ' and ' : ''}
              </React.Fragment>
            ))}
            . However, the group is leaving{' '}
            <strong className="text-red-700 font-bold">{formatINR(health.combinedIdleValue)}</strong> on the table across{' '}
            {health.combinedIdleCount} stalled deals
            {worst && (
              <>
                , and <strong className="text-red-700 font-bold">{worst.branchName} ({worst.city})</strong> is
                experiencing an operational collapse with a{' '}
                <strong className="text-red-700 font-bold">{formatPct(worst.neverContactedRate)} never-contacted lead rate</strong>
              </>
            )}
            . Immediate CEO action this morning will unblock {formatINR(health.orderPlacedStaleValue)} in delayed
            deliveries and prevent further lead decay{worst ? ` in ${worst.city}` : ''}.
          </p>
        </div>

        {/* The 4 Immediate Monday Morning Directives */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            Critical Operational Directives for Today (Monday, 9:00 AM)
          </h3>

          {/* Directive 1: Lakeside Crisis */}
          <div className="border border-red-200 bg-red-50/50 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-red-950">
                  Intervene in {worst?.branchName ?? 'the weakest branch'} ({worst?.city}) Contact Collapse
                </h4>
              </div>
              <span className="text-xs font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-sm">
                Priority: Critical
              </span>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              <strong>What is broken:</strong> {worst?.branchName} converts at only{' '}
              <strong>{worst && formatPct(worst.conversionRate)}</strong> ({worst?.deliveredUnits}/{worst?.totalLeads}) vs the{' '}
              {formatPct(hl.groupMeanConversion)} group mean.{' '}
              <strong>{worst?.neverContactedCount} incoming leads ({worst && formatPct(worst.neverContactedRate)})</strong>{' '}
              were closed without a single customer phone call.
              {hl.worstRep && (
                <> In addition, rep <strong>{hl.worstRep.repName} ({hl.worstRep.repId})</strong> is a severe statistical
                outlier ({formatPct(hl.worstRep.conversionRate)} conversion, z-score {hl.worstRep.zScore.toFixed(2)}).</>
              )}
            </p>
            <div className="bg-white rounded-lg p-3 text-xs text-slate-800 border border-red-200">
              <strong className="text-slate-900 block mb-1">Executive Order:</strong>
              1) Summon {worstBM ? `Branch Manager ${worstBM.name}` : 'the branch manager'} at 09:30 AM; 2) Enforce an
              immediate 2-hour CRM contact SLA;
              {hl.worstRep && hl.topPeer && (
                <> 3) Reassign active leads from {hl.worstRep.repName} to top-performer {hl.topPeer.repName} ({formatPct(hl.topPeer.conversionRate)}).</>
              )}
            </div>
          </div>

          {/* Directive 2: Fulfilment Bottleneck */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-blue-950">
                  Unclog the {formatINR(health.orderPlacedStaleValue)} Booked Fulfilment Bottleneck
                </h4>
              </div>
              <span className="text-xs font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-sm">
                Priority: High Impact
              </span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>What is broken:</strong>{' '}
              {health.orderPlacedStaleCount > 0 ? (
                <>
                  {health.orderPlacedStaleCount} customers who placed deposits are sitting idle without vehicle handover
                  (&ge;7 days). <strong>{health.orderPlacedAged17Count} of these orders ({formatINR(health.orderPlacedAged17Value)})</strong>{' '}
                  have been waiting &ge;17 days (exceeding our {bottlenecks.medianDays}-day median benchmark).
                  {bottlenecks.reasons.length > 0 && (
                    <>
                      {' '}The top delay causes are{' '}
                      {bottlenecks.reasons.slice(0, 3).map((r, i) => (
                        <React.Fragment key={r.reason}>
                          {i > 0 ? ', ' : ''}
                          {r.reason.toLowerCase()} ({r.count})
                        </React.Fragment>
                      ))}
                      .
                    </>
                  )}
                </>
              ) : (
                <>No booked orders are stalled beyond 7 days in this cohort — fulfilment is on track.</>
              )}
            </p>
            <div className="bg-white rounded-lg p-3 text-xs text-slate-800 border border-blue-200">
              <strong className="text-slate-900 block mb-1">Executive Order:</strong>
              Instruct Central Logistics Head to review trailer dispatch with Toyota India regional logistics, 
              and mandate workshop pre-fitment of accessory kits 48h prior to vehicle arrival.
            </div>
          </div>

          {/* Directive 3: Sales Stalled Follow-up */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-sm font-bold text-amber-950">
                  Rescue {formatINR(health.preOrderStaleValue)} in Neglected Pre-Order Inquiries
                </h4>
              </div>
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                Priority: Immediate Revenue
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>What is broken:</strong>{' '}
              {health.preOrderStaleCount > 0
                ? `${health.preOrderStaleCount} hot prospects who completed test drives or commercial negotiations have been left untouched for ≥7 days. These are prime customer leads about to defect to competitors like Hyundai or Mahindra.`
                : 'No pre-order inquiries are currently stalled beyond 7 days — sales follow-up discipline is holding.'}
            </p>
            {health.preOrderStaleCount > 0 && (
              <div className="bg-white rounded-lg p-3 text-xs text-slate-800 border border-amber-200">
                <strong className="text-slate-900 block mb-1">Executive Order:</strong>
                Require all {branchMetrics.length} Branch Managers to personally call these{' '}
                {health.preOrderStaleCount} clients before 12:00 PM today with customized finance or exchange incentives.
              </div>
            )}
          </div>

          {/* Directive 4: CRM Data Hygiene (Traps 4 & 6) */}
          <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="text-sm font-bold text-purple-950">
                  Eliminate CRM Data Fabrication (Traps 4 & 6 Fix)
                </h4>
              </div>
              <span className="text-xs font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded-sm">
                Priority: Governance
              </span>
            </div>
            <p className="text-xs text-purple-900 leading-relaxed">
              <strong>What is broken:</strong>{' '}
              {trap6Count + trap4Count > 0 ? (
                <>
                  Reps fabricated lost dispositions: <strong>{trap6Count} lost leads</strong> were tagged{' '}
                  <em>"Dissatisfied with test drive"</em> despite never having a test drive in history. Additionally,{' '}
                  <strong>{trap4Count} leads</strong> were lost with zero reason recorded.
                </>
              ) : (
                <>CRM disposition data is clean for this cohort — no fabricated or missing lost reasons.</>
              )}
            </p>
            <div className="bg-white rounded-lg p-3 text-xs text-slate-800 border border-purple-200">
              <strong className="text-slate-900 block mb-1">Executive Order:</strong>
              Implement automated validation rules in the CRM preventing reps from selecting test-drive reasons without a completed test-drive timestamp.
            </div>
          </div>
        </div>

        {/* Branch League Table for Board Packet */}
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            Branch League Summary Table
          </h3>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-right">Leads</th>
                <th className="py-2.5 px-3 text-right">Delivered</th>
                <th className="py-2.5 px-3 text-right">Conversion</th>
                <th className="py-2.5 px-3 text-right">Never Contacted</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {branchMetrics
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .map((b) => (
                  <tr key={b.branchId} className={b.branchId === 'B3' ? 'bg-red-50 font-bold' : ''}>
                    <td className="py-2.5 px-3">{b.branchName}</td>
                    <td className="py-2.5 px-3">{b.city}</td>
                    <td className="py-2.5 px-3 text-right">{b.totalLeads}</td>
                    <td className="py-2.5 px-3 text-right">{b.deliveredUnits}</td>
                    <td className="py-2.5 px-3 text-right">{formatPct(b.conversionRate)}</td>
                    <td className="py-2.5 px-3 text-right">{formatPct(b.neverContactedRate)} ({b.neverContactedCount})</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(b.deliveredRevenue)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Sign-off Block */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-500">
          <div>Prepared automatically by DealerPulse Intelligence Engine</div>
          <div>Reviewed by: ________________________ (Group CEO)</div>
        </div>
      </div>
    </div>
  );
};
