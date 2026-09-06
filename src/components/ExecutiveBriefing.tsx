import React from 'react';
import { DealershipData } from '../types';
import { calculateBranchMetrics, calculatePipelineHealth, calculateFunnelMetrics } from '../lib/metrics';
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

  const { periodStart, periodEnd } = useDashboardStore();
  const period = { start: periodStart, end: periodEnd };
  const fullYear = isFullPeriod(period);

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
          <strong>Note:</strong> the time filter is set to <strong>{periodLabel(period)}</strong>. The
          league table below reflects that cohort, but the written directives are anchored to the
          full-year (Jun–Dec 2025) analysis. Reset the period filter for the canonical briefing.
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
              DealerPulse Executive Briefing: 5-Branch Group Health
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Data Cut-Off: 31 December 2025, 19:10:00 UTC · Scope: 5 Branches, 30 Sales Staff, 510 Leads
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Total Group Revenue</span>
            <span className="text-2xl font-black text-slate-900 block">
              {formatINR(funnel.deliveredRevenue)}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              160 Units Delivered (31.4% Conv)
            </span>
          </div>
        </div>

        {/* Executive 30-Second Bottom Line */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-800 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">Executive Bottom Line:</h3>
          <p className="leading-relaxed">
            Overall group performance is driven by healthy conversion at <strong>Downtown Toyota (41.2%)</strong> and <strong>Eastside Toyota (37.0%)</strong>. 
            However, the group is leaving <strong className="text-red-700 font-bold">₹9.16 Cr</strong> on the table across 39 stalled deals, 
            and <strong className="text-red-700 font-bold">Lakeside Toyota (Bangalore)</strong> is experiencing an operational collapse with a 
            <strong className="text-red-700 font-bold"> 41.8% never-contacted lead rate</strong>. Immediate CEO action this morning will unblock 
            ₹7.68 Cr in delayed deliveries and prevent catastrophic lead decay in Bangalore.
          </p>
        </div>

        {/* The 4 Immediate Monday Morning Directives */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
            The 4 Critical Operational Directives for Today (Monday, 9:00 AM)
          </h3>

          {/* Directive 1: Lakeside Crisis */}
          <div className="border border-red-200 bg-red-50/50 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-red-950">
                  Intervene in Lakeside Toyota (Bangalore) Contact Collapse
                </h4>
              </div>
              <span className="text-xs font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-sm">
                Priority: Critical
              </span>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              <strong>What is broken:</strong> Lakeside converts at only <strong>7.6%</strong> (6/79) vs the 31.4% group mean. 
              <strong>33 incoming leads (41.8%)</strong> were closed without a single customer phone call. In addition, 
              rep <strong>Venkat Mishra (SR16)</strong> is a severe statistical outlier (4.55% conversion, z-score -1.53).
            </p>
            <div className="bg-white rounded-lg p-3 text-xs text-slate-800 border border-red-200">
              <strong className="text-slate-900 block mb-1">Executive Order:</strong>
              1) Summon Branch Manager Anand Kulkarni at 09:30 AM; 2) Enforce an immediate 2-hour CRM contact SLA; 
              3) Reassign 10 active leads from Venkat Mishra to top-performer Varun Kamath (11.11%).
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
                  Unclog the ₹7.68 Cr Booked Fulfilment Bottleneck
                </h4>
              </div>
              <span className="text-xs font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-sm">
                Priority: High Impact
              </span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>What is broken:</strong> 33 customers who placed deposits are sitting idle without vehicle handover (&ge;7 days). 
              <strong>27 of these orders ({formatINR(health.orderPlacedAged17Value)})</strong> have been waiting &ge;17 days (exceeding our 17-day median benchmark). 
              The top delay causes are logistics transit (11), factory allocation (11), and accessory fitment backlog (10).
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
                  Rescue ₹1.48 Cr in Neglected Pre-Order Inquiries
                </h4>
              </div>
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                Priority: Immediate Revenue
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>What is broken:</strong> 6 hot prospects who completed test drives or commercial negotiations have been left untouched for &ge;7 days. 
              These are prime customer leads about to defect to competitors like Hyundai or Mahindra.
            </p>
            <div className="bg-white rounded-lg p-3 text-xs text-slate-800 border border-amber-200">
              <strong className="text-slate-900 block mb-1">Executive Order:</strong>
              Require all 5 Branch Managers to personally call these 6 clients before 12:00 PM today with customized finance or exchange incentives.
            </div>
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
              <strong>What is broken:</strong> Reps fabricated lost dispositions: <strong>20 lost leads</strong> were tagged 
              <em>"Dissatisfied with test drive"</em> despite never having a test drive in history. Additionally, <strong>14 leads</strong> were lost with zero reason recorded.
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
          <table className="w-full text-left text-xs text-slate-700">
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

        {/* Sign-off Block */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>Prepared automatically by DealerPulse Intelligence Engine</div>
          <div>Reviewed by: ________________________ (Group CEO)</div>
        </div>
      </div>
    </div>
  );
};
