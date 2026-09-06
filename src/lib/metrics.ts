import { DealershipData, Lead, Delivery, SalesRep, BranchMetrics, RepMetrics, FunnelMetrics, LeadStatus } from '../types';
import { DATA_AS_OF, calculateIdleDays } from './data';

export type FunnelSummary = {
  stages: FunnelMetrics[];
  statusCounts: Record<LeadStatus, number>;
  totalLeads: number;
  neverContactedCount: number;
  neverContactedRate: number;
  deliveredRevenue: number;
};

/**
 * Pure function to calculate funnel metrics based on status_history reach
 */
export function calculateFunnelMetrics(leads: Lead[]): FunnelSummary {
  const totalLeads = leads.length;
  const statusCounts: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    test_drive: 0,
    negotiation: 0,
    order_placed: 0,
    delivered: 0,
    lost: 0,
  };

  const stageReach: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    test_drive: 0,
    negotiation: 0,
    order_placed: 0,
    delivered: 0,
    lost: 0,
  };

  let neverContactedCount = 0;
  let deliveredRevenue = 0;

  for (const lead of leads) {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;

    const historyStatuses = new Set(lead.status_history.map((h) => h.status));
    
    // Always reached 'new'
    stageReach.new += 1;
    if (historyStatuses.has('contacted')) stageReach.contacted += 1;
    if (historyStatuses.has('test_drive')) stageReach.test_drive += 1;
    if (historyStatuses.has('negotiation')) stageReach.negotiation += 1;
    if (historyStatuses.has('order_placed')) stageReach.order_placed += 1;
    if (historyStatuses.has('delivered') || lead.status === 'delivered') stageReach.delivered += 1;

    if (!historyStatuses.has('contacted')) {
      neverContactedCount += 1;
    }

    if (lead.status === 'delivered') {
      deliveredRevenue += lead.deal_value;
    }
  }

  const funnelOrder: { stage: LeadStatus; label: string }[] = [
    { stage: 'new', label: 'Lead Created' },
    { stage: 'contacted', label: 'Contacted' },
    { stage: 'test_drive', label: 'Test Drive' },
    { stage: 'negotiation', label: 'Negotiation' },
    { stage: 'order_placed', label: 'Order Placed' },
    { stage: 'delivered', label: 'Delivered' },
  ];

  const stages: FunnelMetrics[] = [];
  let prevCount = totalLeads;

  for (let i = 0; i < funnelOrder.length; i++) {
    const item = funnelOrder[i];
    const count = stageReach[item.stage];
    const pctOfTotal = totalLeads > 0 ? count / totalLeads : 0;
    const dropoffFromPrevPct = prevCount > 0 ? (prevCount - count) / prevCount : 0;

    stages.push({
      stage: item.stage,
      label: item.label,
      count,
      pctOfTotal,
      dropoffFromPrevPct: i === 0 ? 0 : dropoffFromPrevPct,
    });

    prevCount = count;
  }

  return {
    stages,
    statusCounts,
    totalLeads,
    neverContactedCount,
    neverContactedRate: totalLeads > 0 ? neverContactedCount / totalLeads : 0,
    deliveredRevenue,
  };
}

/**
 * Calculate branch metrics
 */
export function calculateBranchMetrics(data: DealershipData, targetMonth: string = '2025-12'): BranchMetrics[] {
  const deliveryMap = new Map<string, Delivery>();
  data.deliveries.forEach((d) => deliveryMap.set(d.lead_id, d));

  return data.branches.map((branch) => {
    const bLeads = data.leads.filter((l) => l.branch_id === branch.id);
    const totalLeads = bLeads.length;
    const deliveredLeads = bLeads.filter((l) => l.status === 'delivered');
    const lostLeads = bLeads.filter((l) => l.status === 'lost');
    const openLeads = bLeads.filter((l) => l.status !== 'delivered' && l.status !== 'lost');

    const deliveredUnits = deliveredLeads.length;
    const deliveredRevenue = deliveredLeads.reduce((sum, l) => sum + l.deal_value, 0);
    const openPipelineValue = openLeads.reduce((sum, l) => sum + l.deal_value, 0);

    const testDriveReached = bLeads.filter((l) =>
      l.status_history.some((h) => h.status === 'test_drive')
    ).length;

    const neverContacted = bLeads.filter(
      (l) => !l.status_history.some((h) => h.status === 'contacted')
    ).length;

    // Target for specified month
    const target = data.targets.find(
      (t) => t.branch_id === branch.id && t.month === targetMonth
    );
    const targetUnits = target ? target.target_units : 0;
    const targetRevenue = target ? target.target_revenue : 0;

    // Delivery duration metrics
    const bDeliveries = deliveredLeads
      .map((l) => deliveryMap.get(l.id))
      .filter((d): d is Delivery => !!d);

    const deliveryDays = bDeliveries.map((d) => d.days_to_deliver).sort((a, b) => a - b);
    const avgDays = deliveryDays.length > 0 ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length : 0;
    const medianDays = deliveryDays.length > 0 ? deliveryDays[Math.floor(deliveryDays.length / 2)] : 0;

    return {
      branchId: branch.id,
      branchName: branch.name,
      city: branch.city,
      totalLeads,
      deliveredUnits,
      deliveredRevenue,
      targetUnits,
      targetRevenue,
      attainmentUnitsPct: targetUnits > 0 ? deliveredUnits / targetUnits : 0,
      attainmentRevenuePct: targetRevenue > 0 ? deliveredRevenue / targetRevenue : 0,
      conversionRate: totalLeads > 0 ? deliveredUnits / totalLeads : 0,
      testDriveRate: totalLeads > 0 ? testDriveReached / totalLeads : 0,
      lostRate: totalLeads > 0 ? lostLeads.length / totalLeads : 0,
      neverContactedCount: neverContacted,
      neverContactedRate: totalLeads > 0 ? neverContacted / totalLeads : 0,
      openLeadsCount: openLeads.length,
      openPipelineValue,
      avgDaysToDeliver: avgDays,
      medianDaysToDeliver: medianDays,
    };
  });
}

/**
 * Calculate sales rep metrics and flag statistically significant outliers (Rule 6)
 * Trap 5: Exclude branch managers (0 leads) from mean/std calculations!
 */
export function calculateRepMetrics(data: DealershipData, branchId?: string, asOfDate: Date = DATA_AS_OF): RepMetrics[] {
  const branchMap = new Map(data.branches.map((b) => [b.id, b.name]));
  const reps = branchId && branchId !== 'all'
    ? data.sales_reps.filter((r) => r.branch_id === branchId)
    : data.sales_reps;

  // Group officers by branch to calculate branch-level mean & std dev
  const officersByBranch = new Map<string, { rep: SalesRep; leads: Lead[]; rate: number }[]>();

  data.sales_reps.forEach((rep) => {
    if (rep.role !== 'sales_officer') return; // Exclude branch managers
    const repLeads = data.leads.filter((l) => l.assigned_to === rep.id);
    const deliveredCount = repLeads.filter((l) => l.status === 'delivered').length;
    const rate = repLeads.length > 0 ? deliveredCount / repLeads.length : 0;

    if (!officersByBranch.has(rep.branch_id)) {
      officersByBranch.set(rep.branch_id, []);
    }
    officersByBranch.get(rep.branch_id)!.push({ rep, leads: repLeads, rate });
  });

  // Calculate mean, std dev, and threshold per branch
  const branchStats = new Map<string, { mean: number; std: number; threshold: number }>();
  officersByBranch.forEach((officerList, bId) => {
    const rates = officerList.map((o) => o.rate);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;
    const std = Math.sqrt(variance);
    const threshold = mean - 1.5 * std;
    branchStats.set(bId, { mean, std, threshold });
  });

  return reps.map((rep) => {
    const repLeads = data.leads.filter((l) => l.assigned_to === rep.id);
    const delivered = repLeads.filter((l) => l.status === 'delivered');
    const openLeads = repLeads.filter((l) => l.status !== 'delivered' && l.status !== 'lost');
    const stalledLeads = openLeads.filter((l) => calculateIdleDays(l.last_activity_at, asOfDate) >= 7);

    const totalLeads = repLeads.length;
    const deliveredUnits = delivered.length;
    const deliveredRevenue = delivered.reduce((sum, l) => sum + l.deal_value, 0);
    const conversionRate = totalLeads > 0 ? deliveredUnits / totalLeads : 0;

    let isOutlier = false;
    let zScore = 0;

    if (rep.role === 'sales_officer' && totalLeads >= 10) {
      const stats = branchStats.get(rep.branch_id);
      if (stats && stats.std > 0) {
        zScore = (conversionRate - stats.mean) / stats.std;
        if (conversionRate < stats.threshold) {
          isOutlier = true;
        }
      }
    }

    return {
      repId: rep.id,
      repName: rep.name,
      branchId: rep.branch_id,
      branchName: branchMap.get(rep.branch_id) || rep.branch_id,
      role: rep.role,
      totalLeads,
      deliveredUnits,
      deliveredRevenue,
      conversionRate,
      isOutlier,
      zScore,
      openLeadsCount: openLeads.length,
      stalledLeadsCount: stalledLeads.length,
    };
  });
}

/**
 * Lead source conversion analysis
 */
export function calculateSourceMetrics(leads: Lead[]) {
  const sourceGroups = new Map<string, { total: number; delivered: number; revenue: number }>();

  leads.forEach((l) => {
    if (!sourceGroups.has(l.source)) {
      sourceGroups.set(l.source, { total: 0, delivered: 0, revenue: 0 });
    }
    const g = sourceGroups.get(l.source)!;
    g.total += 1;
    if (l.status === 'delivered') {
      g.delivered += 1;
      g.revenue += l.deal_value;
    }
  });

  return Array.from(sourceGroups.entries()).map(([source, stats]) => ({
    source,
    totalLeads: stats.total,
    deliveredUnits: stats.delivered,
    deliveredRevenue: stats.revenue,
    conversionRate: stats.total > 0 ? stats.delivered / stats.total : 0,
  })).sort((a, b) => b.conversionRate - a.conversionRate);
}

/**
 * Pipeline health analysis (Action board)
 */
export function calculatePipelineHealth(leads: Lead[], asOfDate: Date = DATA_AS_OF) {
  const openLeads = leads.filter((l) => l.status !== 'delivered' && l.status !== 'lost');

  // Pre-order open leads (new, contacted, test_drive, negotiation)
  const preOrderOpen = openLeads.filter((l) => l.status !== 'order_placed');
  const preOrderStale = preOrderOpen.filter((l) => calculateIdleDays(l.last_activity_at, asOfDate) >= 7);
  const preOrderFresh = preOrderOpen.filter((l) => calculateIdleDays(l.last_activity_at, asOfDate) < 7);

  // Order placed open leads
  const orderPlacedOpen = openLeads.filter((l) => l.status === 'order_placed');
  const orderPlacedStale = orderPlacedOpen.filter((l) => calculateIdleDays(l.last_activity_at, asOfDate) >= 7);
  const orderPlacedAged17 = orderPlacedOpen.filter((l) => calculateIdleDays(l.last_activity_at, asOfDate) >= 17);

  // Combined idle >= 7 days
  const combinedIdle = [...preOrderStale, ...orderPlacedStale];

  return {
    totalOpenLeads: openLeads.length,
    totalOpenValue: openLeads.reduce((sum, l) => sum + l.deal_value, 0),

    preOrderCount: preOrderOpen.length,
    preOrderValue: preOrderOpen.reduce((sum, l) => sum + l.deal_value, 0),
    preOrderStaleCount: preOrderStale.length,
    preOrderStaleValue: preOrderStale.reduce((sum, l) => sum + l.deal_value, 0),
    preOrderStaleLeads: preOrderStale,

    orderPlacedCount: orderPlacedOpen.length,
    orderPlacedValue: orderPlacedOpen.reduce((sum, l) => sum + l.deal_value, 0),
    orderPlacedStaleCount: orderPlacedStale.length,
    orderPlacedStaleValue: orderPlacedStale.reduce((sum, l) => sum + l.deal_value, 0),
    orderPlacedStaleLeads: orderPlacedStale,
    orderPlacedAged17Count: orderPlacedAged17.length,
    orderPlacedAged17Value: orderPlacedAged17.reduce((sum, l) => sum + l.deal_value, 0),
    orderPlacedAged17Leads: orderPlacedAged17,

    combinedIdleCount: combinedIdle.length,
    combinedIdleValue: combinedIdle.reduce((sum, l) => sum + l.deal_value, 0),
  };
}

/**
 * Delivery bottlenecks and delay reasons
 */
export function calculateDeliveryBottlenecks(deliveries: Delivery[]) {
  const reasonCounts: Record<string, number> = {};
  let onTimeCount = 0;
  let delayedCount = 0;

  deliveries.forEach((d) => {
    if (!d.delay_reason) {
      onTimeCount += 1;
    } else {
      delayedCount += 1;
      reasonCounts[d.delay_reason] = (reasonCounts[d.delay_reason] || 0) + 1;
    }
  });

  const sortedReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      pctOfDelayed: delayedCount > 0 ? count / delayedCount : 0,
      pctOfTotal: deliveries.length > 0 ? count / deliveries.length : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const daysList = deliveries.map((d) => d.days_to_deliver).sort((a, b) => a - b);
  const medianDays = daysList.length > 0 ? daysList[Math.floor(daysList.length / 2)] : 0;
  const maxDays = daysList.length > 0 ? daysList[daysList.length - 1] : 0;
  const p90Days = daysList.length > 0 ? daysList[Math.floor(daysList.length * 0.9)] : 0;

  return {
    totalDeliveries: deliveries.length,
    onTimeCount,
    delayedCount,
    onTimeRate: deliveries.length > 0 ? onTimeCount / deliveries.length : 0,
    delayedRate: deliveries.length > 0 ? delayedCount / deliveries.length : 0,
    reasons: sortedReasons,
    medianDays,
    maxDays,
    p90Days,
  };
}
