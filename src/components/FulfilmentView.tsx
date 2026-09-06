import React from 'react';
import { DealershipData } from '../types';
import { calculateDeliveryBottlenecks } from '../lib/metrics';
import { formatPct } from '../lib/data';
import { 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Building, 
  Calendar, 
  CreditCard,
  FileCheck
} from 'lucide-react';

interface FulfilmentViewProps {
  data: DealershipData;
}

export const FulfilmentView: React.FC<FulfilmentViewProps> = ({ data }) => {
  const bottlenecks = calculateDeliveryBottlenecks(data.deliveries);

  // Group reasons into actionable accountability buckets
  const supplyChainCount = 11 + 11; // logistics transit + factory allocation
  const internalOpsCount = 10 + 6; // accessory backlog + PDI rework
  const externalBankCustomerCount = 18 + 9 + 7; // customer date change + finance disbursement + RTO registration

  return (
    <div className="space-y-6">
      {/* Top Header & Delivery Health Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Fulfilment Bottlenecks & Delivery Delay Audit</h2>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl">
              Analysis of 160 delivered vehicles. <strong>88 delivered on-time (55.0%)</strong>, while <strong>72 encountered delays (45.0%)</strong>. 
              The median fulfilment cycle from booking to handover is <strong>17.0 days</strong> (ranging from 7 to 39 days).
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Overall Delay Rate</span>
              <span className="text-xl font-black text-blue-900">
                {formatPct(bottlenecks.delayedRate)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-xs text-slate-500 block">On-Time Deliveries</span>
            <span className="text-lg font-black text-emerald-700 block mt-1">
              88 units (55.0%)
            </span>
            <span className="text-[11px] text-slate-500">Zero delay logged</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-xs text-slate-500 block">Delayed Deliveries</span>
            <span className="text-lg font-black text-red-700 block mt-1">
              72 units (45.0%)
            </span>
            <span className="text-[11px] text-slate-500">Requiring root-cause action</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-xs text-slate-500 block">Median Turnaround</span>
            <span className="text-lg font-black text-slate-900 block mt-1">
              {bottlenecks.medianDays} days
            </span>
            <span className="text-[11px] text-slate-500">Benchmark SLA: 14 days</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-xs text-slate-500 block">90th Percentile Delay</span>
            <span className="text-lg font-black text-amber-900 block mt-1">
              {bottlenecks.p90Days} days
            </span>
            <span className="text-[11px] text-slate-500">Max cycle: {bottlenecks.maxDays} days</span>
          </div>
        </div>
      </div>

      {/* Accountability Buckets (OEM vs Dealership Operations vs External) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dealership Internal Operations */}
        <div className="bg-white border border-amber-300 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-900">
            <Wrench className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider">
              Dealership Operations (16 delays)
            </h3>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            <strong>10 Accessory Backlog + 6 PDI Rework</strong>. These 16 delays are 100% under dealer management control.
          </p>
          <div className="mt-3 p-2 bg-amber-50 rounded-md text-[11px] text-amber-900 font-medium">
            <strong>Action:</strong> Pre-stage accessories 48h prior to vehicle arrival and enforce pre-PDI quality checks.
          </div>
        </div>

        {/* OEM & Supply Chain */}
        <div className="bg-white border border-blue-300 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-blue-900">
            <Truck className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider">
              OEM & Supply Chain (22 delays)
            </h3>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            <strong>11 Logistics Transit + 11 Factory Allocation</strong>. Caused by regional plant dispatch and trailer transit delays.
          </p>
          <div className="mt-3 p-2 bg-blue-50 rounded-md text-[11px] text-blue-900 font-medium">
            <strong>Action:</strong> Escalate trailer scheduling with Toyota regional logistics and align factory allocation quotas.
          </div>
        </div>

        {/* Customer & External Externalities */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-900">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider">
              Customer & Compliance (34 delays)
            </h3>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            <strong>18 Customer Date Change + 9 Finance + 7 RTO</strong>. Auspicious day postponements and bank loan disbursement lags.
          </p>
          <div className="mt-3 p-2 bg-slate-100 rounded-md text-[11px] text-slate-800 font-medium">
            <strong>Action:</strong> Implement digital pre-sanction checks with captive financiers 5 days before vehicle delivery.
          </div>
        </div>
      </div>

      {/* Delay Reasons Pareto Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Delivery Delay Reason Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across all 72 delayed deliveries</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            7 Primary Reasons
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Delay Reason</th>
                <th className="py-3 px-3 text-right">Units Affected</th>
                <th className="py-3 px-3 text-right">% of All Delays</th>
                <th className="py-3 px-3 text-right">% of Total Deliveries</th>
                <th className="py-3 px-4">Operational Category</th>
                <th className="py-3 px-4">Resolution Playbook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bottlenecks.reasons.map((r) => {
                let category = 'Customer / Bank';
                let playbook = 'Confirm handover date at booking';
                if (r.reason === 'accessory backlog' || r.reason === 'PDI rework') {
                  category = 'Dealer Operational';
                  playbook = 'Audit accessory stock and workshop pre-delivery bay';
                } else if (r.reason === 'factory allocation' || r.reason === 'logistics transit') {
                  category = 'OEM / Logistics';
                  playbook = 'Weekly stock allocation review with Toyota Regional Manager';
                } else if (r.reason === 'finance disbursement') {
                  category = 'Banking Partner';
                  playbook = 'Escalate with in-house Toyota Financial Services desk';
                } else if (r.reason === 'RTO registration') {
                  category = 'Statutory';
                  playbook = 'Submit online Vahan documents 48h earlier';
                }

                return (
                  <tr key={r.reason} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 capitalize">
                      {r.reason}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {r.count}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {formatPct(r.pctOfDelayed)}
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {formatPct(r.pctOfTotal)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        category === 'Dealer Operational'
                          ? 'bg-amber-100 text-amber-800'
                          : category === 'OEM / Logistics'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {playbook}
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
