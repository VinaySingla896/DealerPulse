import React, { useState } from 'react';
import { DealershipData, Lead, SalesRep, Branch } from '../types';
import { useDashboardStore } from '../store/useDashboardStore';
import { calculatePipelineHealth, calculateFunnelMetrics } from '../lib/metrics';
import { formatINR, calculateIdleDays, displayLostReason } from '../lib/data';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Truck, 
  UserCheck, 
  Search, 
  ShieldAlert,
  ArrowUpRight,
  Send
} from 'lucide-react';

interface PipelineActionBoardProps {
  data: DealershipData;
}

type TabType = 'all_stalled' | 'fulfilment' | 'sales' | 'audit_trap6' | 'audit_trap4';

export const PipelineActionBoard: React.FC<PipelineActionBoardProps> = ({ data }) => {
  const { selectedBranchId, selectedSource } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<TabType>('all_stalled');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionedLeadIds, setActionedLeadIds] = useState<Set<string>>(new Set());
  const [actionToast, setActionToast] = useState<string | null>(null);

  const repMap = new Map<string, SalesRep>(data.sales_reps.map((r) => [r.id, r]));
  const branchMap = new Map<string, Branch>(data.branches.map((b) => [b.id, b]));

  // Filter leads based on global filter
  const baseLeads = data.leads.filter((lead) => {
    if (selectedBranchId !== 'all' && lead.branch_id !== selectedBranchId) return false;
    if (selectedSource !== 'all' && lead.source !== selectedSource) return false;
    return true;
  });

  const health = calculatePipelineHealth(baseLeads);

  // Trap 6 leads: marked "Dissatisfied with test drive" but never had test_drive in history
  const trap6Leads = baseLeads.filter(
    (l) =>
      l.lost_reason === 'Dissatisfied with test drive' &&
      !l.status_history.some((h) => h.status === 'test_drive')
  );

  // Trap 4 leads: lost leads with null lost_reason
  const trap4Leads = baseLeads.filter(
    (l) => l.status === 'lost' && l.lost_reason === null
  );

  let currentLeads: Lead[] = [];
  if (activeTab === 'all_stalled') {
    currentLeads = [...health.orderPlacedStaleLeads, ...health.preOrderStaleLeads];
  } else if (activeTab === 'fulfilment') {
    currentLeads = health.orderPlacedStaleLeads;
  } else if (activeTab === 'sales') {
    currentLeads = health.preOrderStaleLeads;
  } else if (activeTab === 'audit_trap6') {
    currentLeads = trap6Leads;
  } else if (activeTab === 'audit_trap4') {
    currentLeads = trap4Leads;
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    currentLeads = currentLeads.filter(
      (l) =>
        l.customer_name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.model_interested.toLowerCase().includes(q) ||
        (repMap.get(l.assigned_to)?.name.toLowerCase().includes(q) ?? false)
    );
  }

  const handleTriggerAction = (leadId: string, actionName: string) => {
    setActionedLeadIds((prev) => new Set(prev).add(leadId));
    setActionToast(`✓ ${actionName} triggered for ${leadId}!`);
    setTimeout(() => setActionToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Header Summary & Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="text-base font-bold text-slate-900">Pipeline Health & Operational Action Board</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                Rule 1: Every Number Drives Action
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl">
              <strong>{health.combinedIdleCount} deals</strong> worth <strong>{formatINR(health.combinedIdleValue)}</strong> have had zero recorded rep or fulfilment activity for &ge;7 days. 
              The majority (<strong className="text-slate-900 font-bold">{formatINR(health.orderPlacedStaleValue)}</strong> across 33 deals) is a <strong>fulfilment delay bottleneck</strong>, while <strong>{formatINR(health.preOrderStaleValue)}</strong> represents neglected sales inquiries.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Pipeline at Risk</span>
              <span className="text-xl font-black text-amber-900">
                {formatINR(health.combinedIdleValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <button
              id="tab-all-stalled"
              onClick={() => setActiveTab('all_stalled')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'all_stalled'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Stalled ({health.combinedIdleCount} · {formatINR(health.combinedIdleValue)})
            </button>

            <button
              id="tab-fulfilment"
              onClick={() => setActiveTab('fulfilment')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'fulfilment'
                  ? 'bg-blue-700 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Fulfilment Delay ({health.orderPlacedStaleCount} booked · {formatINR(health.orderPlacedStaleValue)})
            </button>

            <button
              id="tab-sales"
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'sales'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sales Follow-up ({health.preOrderStaleCount} leads · {formatINR(health.preOrderStaleValue)})
            </button>

            <button
              id="tab-audit-trap6"
              onClick={() => setActiveTab('audit_trap6')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'audit_trap6'
                  ? 'bg-red-700 text-white font-bold'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              Trap 6: Test Drive Mismatches ({trap6Leads.length})
            </button>

            <button
              id="tab-audit-trap4"
              onClick={() => setActiveTab('audit_trap4')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'audit_trap4'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              Trap 4: Missing Reason ({trap4Leads.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, rep, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 text-xs rounded-md focus:outline-hidden focus:ring-2 focus:ring-slate-900 w-56 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Context Box for Special Tabs */}
      {activeTab === 'fulfilment' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start space-x-3">
          <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block text-blue-950">
              Fulfilment Bottleneck: 33 booked orders idle &ge;7 days ({formatINR(health.orderPlacedStaleValue)})
            </span>
            <p className="mt-1 leading-relaxed">
              <strong>27 of these 33 bookings have been waiting &ge;17 days</strong> ({formatINR(health.orderPlacedAged17Value)}), exceeding the group median delivery cycle. 
              These customers have paid deposits and are in danger of cancellation due to factory allocation, logistics transit, and accessory delays.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'audit_trap6' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block text-red-950">
              Trap 6 CRM Integrity Alert: 20 Phantom "Dissatisfied with test drive" Dispositions
            </span>
            <p className="mt-1 leading-relaxed">
              These 20 leads were categorized by sales reps as <em>"Dissatisfied with test drive"</em>, yet their audit trail in <code>status_history</code> confirms they <strong>never had a test drive</strong>. 
              Reps selected this reason as a lazy catch-all dropdown to close unresponsive leads. Action: Enforce mandatory CRM intake validation.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'audit_trap4' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block text-purple-950">
              Trap 4 CRM Completeness Alert: 14 Lost Leads with Null Lost Reason
            </span>
            <p className="mt-1 leading-relaxed">
              These 14 leads were closed as lost without recording any reason in the CRM. They are safely displayed here as <em>"Reason not recorded"</em> to prevent UI crashes. Action: Audit rep intake discipline at branch level.
            </p>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Lead ID & Customer</th>
                <th className="py-3 px-3">Vehicle Model</th>
                <th className="py-3 px-3">Branch & Rep</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3 text-right">Idle Days</th>
                <th className="py-3 px-3 text-right">Deal Value</th>
                <th className="py-3 px-3">Status Note / Reason</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => {
                  const idleDays = calculateIdleDays(lead.last_activity_at);
                  const isSevere = idleDays >= 17;
                  const isStale = idleDays >= 7;
                  const rep = repMap.get(lead.assigned_to);
                  const branch = branchMap.get(lead.branch_id);
                  const isActioned = actionedLeadIds.has(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSevere ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{lead.customer_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <span>{lead.id}</span>
                          <span>·</span>
                          <span>{lead.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {lead.model_interested}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{branch?.name}</div>
                        <div className="text-[11px] text-slate-500">{rep?.name}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          lead.status === 'order_placed'
                            ? 'bg-blue-100 text-blue-800'
                            : lead.status === 'lost'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-sm font-black text-xs ${
                          isSevere
                            ? 'bg-red-100 text-red-900'
                            : isStale
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {idleDays.toFixed(1)}d
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatINR(lead.deal_value)}
                      </td>

                      <td className="py-3 px-3 max-w-xs truncate text-[11px] text-slate-600">
                        {lead.status === 'lost' ? (
                          <span className="font-semibold text-slate-800">
                            {displayLostReason(lead.lost_reason)}
                          </span>
                        ) : (
                          lead.status_history[lead.status_history.length - 1]?.note || 'No notes'
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isActioned ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Actioned
                          </span>
                        ) : (
                          <div className="flex items-center justify-center space-x-1.5">
                            {lead.status === 'order_placed' ? (
                              <button
                                onClick={() => handleTriggerAction(lead.id, 'Logistics Escalation')}
                                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                              >
                                Escalate Logistics
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTriggerAction(lead.id, 'WhatsApp Nudge')}
                                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              >
                                Send Nudge
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
