import React, { useState, useEffect, useRef } from 'react';
import { DealershipData, Lead, StatusHistoryEntry, SalesRep, Branch } from '../types';
import { useDashboardStore } from '../store/useDashboardStore';
import { formatINR, formatPct } from '../lib/data';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Calendar, 
  TrendingUp, 
  Truck, 
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface DecemberSimulatorProps {
  data: DealershipData;
}

interface SimEvent {
  leadId: string;
  customerName: string;
  branchId: string;
  branchName: string;
  repName: string;
  model: string;
  status: string;
  timestamp: string;
  day: number;
  note: string;
  dealValue: number;
}

export const DecemberSimulator: React.FC<DecemberSimulatorProps> = ({ data }) => {
  const { simulatorDay, setSimulatorDay, isSimulating, setIsSimulating } = useDashboardStore();
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per day
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const repMap = new Map<string, SalesRep>(data.sales_reps.map((r) => [r.id, r]));
  const branchMap = new Map<string, Branch>(data.branches.map((b) => [b.id, b]));

  // Extract all 343 December events
  const decStart = new Date('2025-12-01T00:00:00Z').getTime();
  const decEnd = new Date('2025-12-31T23:59:59Z').getTime();

  const allDecEvents: SimEvent[] = [];
  data.leads.forEach((lead) => {
    lead.status_history.forEach((h) => {
      const t = new Date(h.timestamp).getTime();
      if (t >= decStart && t <= decEnd) {
        const d = new Date(h.timestamp).getUTCDate();
        allDecEvents.push({
          leadId: lead.id,
          customerName: lead.customer_name,
          branchId: lead.branch_id,
          branchName: branchMap.get(lead.branch_id)?.name || lead.branch_id,
          repName: repMap.get(lead.assigned_to)?.name || lead.assigned_to,
          model: lead.model_interested,
          status: h.status,
          timestamp: h.timestamp,
          day: d,
          note: h.note,
          dealValue: lead.deal_value,
        });
      }
    });
  });

  // Sort events chronologically
  allDecEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Filter events up to current simulatorDay
  const eventsUpToDay = allDecEvents.filter((e) => e.day <= simulatorDay);
  const eventsOnCurrentDay = allDecEvents.filter((e) => e.day === simulatorDay);

  // Cumulative metrics for December up to selected day
  const decDeliveries = eventsUpToDay.filter((e) => e.status === 'delivered');
  const decOrders = eventsUpToDay.filter((e) => e.status === 'order_placed');
  const decTestDrives = eventsUpToDay.filter((e) => e.status === 'test_drive');
  const decContacts = eventsUpToDay.filter((e) => e.status === 'contacted');
  const decNew = eventsUpToDay.filter((e) => e.status === 'new');
  const decLost = eventsUpToDay.filter((e) => e.status === 'lost');

  const decRevenue = decDeliveries.reduce((sum, e) => sum + e.dealValue, 0);

  // Check Lakeside activity in December
  const lakesideDecEvents = eventsUpToDay.filter((e) => e.branchId === 'B3');
  const lakesideContacts = lakesideDecEvents.filter((e) => e.status === 'contacted').length;
  const lakesideNew = lakesideDecEvents.filter((e) => e.status === 'new').length;

  // Animation playback loop
  useEffect(() => {
    if (isSimulating) {
      timerRef.current = setInterval(() => {
        const current = useDashboardStore.getState().simulatorDay;
        if (current >= 31) {
          setIsSimulating(false);
          setSimulatorDay(31);
        } else {
          setSimulatorDay(current + 1);
        }
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, playbackSpeed, setSimulatorDay, setIsSimulating]);

  return (
    <div className="space-y-6">
      {/* Simulator Control Cockpit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
              <h2 className="text-base font-bold text-slate-900">December 2025 Operational Replay Simulator</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900">
                343 Verified Events
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl">
              Step through the 343 status transitions that occurred between Dec 1 and Dec 31, 2025. 
              Observe how the end-of-month delivery rush unfolds and notice the critical stall in Lakeside Toyota's lead outreach.
            </p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setSimulatorDay(1);
                setIsSimulating(false);
              }}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Reset to Dec 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors ${
                isSimulating
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{simulatorDay === 31 ? 'Replay' : 'Play Timeline'}</span>
                </>
              )}
            </button>

            {/* Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-slate-100 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-2 font-semibold focus:outline-hidden"
            >
              <option value={1500}>0.7x Speed</option>
              <option value={1000}>1.0x Speed</option>
              <option value={500}>2.0x Speed</option>
              <option value={200}>5.0x Speed</option>
            </select>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Dec 1, 2025</span>
            <span className="text-sm font-black text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Selected Day: Dec {simulatorDay}, 2025 ({eventsOnCurrentDay.length} events today)
            </span>
            <span>Dec 31, 2025 (Close)</span>
          </div>

          <input
            type="range"
            min={1}
            max={31}
            value={simulatorDay}
            onChange={(e) => setSimulatorDay(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Mid-Month</span>
            <span>Week 4</span>
            <span>Month-End Rush</span>
          </div>
        </div>
      </div>

      {/* Cumulative Metrics for December as of Selected Day */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Dec Deliveries</span>
          <span className="text-xl font-black text-emerald-700 block mt-1">
            {decDeliveries.length} units
          </span>
          <span className="text-[10px] text-slate-400">Total Dec: 52</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Dec Revenue</span>
          <span className="text-xl font-black text-slate-900 block mt-1">
            {formatINR(decRevenue)}
          </span>
          <span className="text-[10px] text-slate-400">Target: ₹12.23 Cr</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Orders Booked</span>
          <span className="text-xl font-black text-blue-700 block mt-1">
            {decOrders.length}
          </span>
          <span className="text-[10px] text-slate-400">In December</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Test Drives Done</span>
          <span className="text-xl font-black text-indigo-700 block mt-1">
            {decTestDrives.length}
          </span>
          <span className="text-[10px] text-slate-400">Completed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Leads Contacted</span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {decContacts.length}
          </span>
          <span className="text-[10px] text-slate-400">First response</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Events Processed</span>
          <span className="text-xl font-black text-purple-700 block mt-1">
            {eventsUpToDay.length} / 343
          </span>
          <span className="text-[10px] text-slate-400">Audit entries</span>
        </div>
      </div>

      {/* Real-time Day Event Stream */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Audit Event Feed on Dec {simulatorDay}, 2025 ({eventsOnCurrentDay.length} transitions)
            </h3>
            <p className="text-xs text-slate-500">Live operational log stream as scrubber advances</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            Showing events on selected day
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {eventsOnCurrentDay.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No status transitions recorded on Dec {simulatorDay}. Scrub forward to view active dates.
            </div>
          ) : (
            eventsOnCurrentDay.map((e, idx) => {
              const isDelivery = e.status === 'delivered';
              const isLakeside = e.branchId === 'B3';

              return (
                <div 
                  key={`${e.leadId}-${idx}`} 
                  className={`p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs transition-colors hover:bg-slate-50 ${
                    isDelivery ? 'bg-emerald-50/40' : isLakeside ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      isDelivery
                        ? 'bg-emerald-600 text-white'
                        : e.status === 'order_placed'
                        ? 'bg-blue-600 text-white'
                        : e.status === 'lost'
                        ? 'bg-slate-300 text-slate-700'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {e.status[0].toUpperCase()}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{e.customerName}</span>
                        <span className="text-slate-400 font-normal">({e.leadId})</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-slate-700">{e.model}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {e.branchName} · Rep: <strong className="text-slate-700">{e.repName}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <span className="text-[11px] text-slate-600 max-w-xs truncate italic">
                      "{e.note}"
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isDelivery
                        ? 'bg-emerald-100 text-emerald-800'
                        : e.status === 'order_placed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {e.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
