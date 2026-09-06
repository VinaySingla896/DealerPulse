import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DealershipData } from '../types';
import {
  calculateFunnelMetrics,
  calculateBranchMetrics,
  calculateRepMetrics,
  calculateSourceMetrics,
  calculatePipelineHealth,
  calculateDeliveryBottlenecks,
} from '../lib/metrics';
import { DATA_AS_OF } from '../lib/data';

describe('DealerPulse Core Metrics Ground-Truth Verification', () => {
  let data: DealershipData;

  beforeAll(() => {
    const raw = fs.readFileSync(path.resolve(__dirname, '../../public/data/dealership_data.json'), 'utf-8');
    data = JSON.parse(raw);
  });

  it('verifies dataset entity counts', () => {
    expect(data.leads.length).toBe(510);
    expect(data.deliveries.length).toBe(160);
    expect(data.branches.length).toBe(5);
    expect(data.sales_reps.length).toBe(30);
  });

  it('verifies funnel stage reach (§4)', () => {
    const funnel = calculateFunnelMetrics(data.leads);
    const reachMap = Object.fromEntries(funnel.stages.map((s) => [s.stage, s.count]));

    expect(reachMap.new).toBe(510);
    expect(reachMap.contacted).toBe(391);
    expect(reachMap.test_drive).toBe(300);
    expect(reachMap.negotiation).toBe(235);
    expect(reachMap.order_placed).toBe(198);
    expect(reachMap.delivered).toBe(160);

    expect(funnel.neverContactedCount).toBe(119);
    expect(funnel.deliveredRevenue).toBe(388800000);
  });

  it('verifies current status counts (§4)', () => {
    const funnel = calculateFunnelMetrics(data.leads);
    const sc = funnel.statusCounts;

    expect(sc.delivered).toBe(160);
    expect(sc.lost).toBe(288);
    expect(sc.order_placed).toBe(38);
    expect(sc.contacted).toBe(10);
    expect(sc.test_drive).toBe(6);
    expect(sc.new).toBe(5);
    expect(sc.negotiation).toBe(3);
  });

  it('verifies branch metrics and Lakeside crisis (§5)', () => {
    const branches = calculateBranchMetrics(data);
    const bMap = Object.fromEntries(branches.map((b) => [b.branchId, b]));

    // B1 Downtown Toyota
    expect(bMap.B1.totalLeads).toBe(97);
    expect(bMap.B1.deliveredUnits).toBe(40);
    expect(Math.round(bMap.B1.conversionRate * 1000) / 10).toBe(41.2);
    expect(Math.round(bMap.B1.testDriveRate * 1000) / 10).toBe(71.1);

    // B2 Highway Toyota
    expect(bMap.B2.totalLeads).toBe(109);
    expect(bMap.B2.deliveredUnits).toBe(36);
    expect(Math.round(bMap.B2.conversionRate * 1000) / 10).toBe(33.0);
    expect(Math.round(bMap.B2.testDriveRate * 1000) / 10).toBe(58.7);

    // B3 Lakeside Toyota (The Crisis)
    expect(bMap.B3.totalLeads).toBe(79);
    expect(bMap.B3.deliveredUnits).toBe(6);
    expect(Math.round(bMap.B3.conversionRate * 1000) / 10).toBe(7.6);
    expect(Math.round(bMap.B3.testDriveRate * 1000) / 10).toBe(34.2);
    expect(Math.round(bMap.B3.lostRate * 1000) / 10).toBe(87.3);
    expect(bMap.B3.neverContactedCount).toBe(33);
    expect(Math.round(bMap.B3.neverContactedRate * 1000) / 10).toBe(41.8);

    // B4 Central Toyota
    expect(bMap.B4.totalLeads).toBe(98);
    expect(bMap.B4.deliveredUnits).toBe(31);
    expect(Math.round(bMap.B4.conversionRate * 1000) / 10).toBe(31.6);
    expect(Math.round(bMap.B4.testDriveRate * 1000) / 10).toBe(65.3);

    // B5 Eastside Toyota
    expect(bMap.B5.totalLeads).toBe(127);
    expect(bMap.B5.deliveredUnits).toBe(47);
    expect(Math.round(bMap.B5.conversionRate * 1000) / 10).toBe(37.0);
    expect(Math.round(bMap.B5.testDriveRate * 1000) / 10).toBe(59.8);
  });

  it('verifies lead source conversion ranks (§5)', () => {
    const sources = calculateSourceMetrics(data.leads);
    const sMap = Object.fromEntries(sources.map((s) => [s.source, s]));

    expect(sMap.walk_in.totalLeads).toBe(140);
    expect(sMap.walk_in.deliveredUnits).toBe(64);
    expect(Math.round(sMap.walk_in.conversionRate * 1000) / 10).toBe(45.7);

    expect(sMap.social_media.totalLeads).toBe(72);
    expect(sMap.social_media.deliveredUnits).toBe(10);
    expect(Math.round(sMap.social_media.conversionRate * 1000) / 10).toBe(13.9);
  });

  it('verifies sales rep outlier rule (Rule 6, Venkat Mishra at Lakeside)', () => {
    const repMetrics = calculateRepMetrics(data, 'B3');
    const outliers = repMetrics.filter((r) => r.isOutlier);

    expect(outliers.length).toBe(1);
    expect(outliers[0].repId).toBe('SR16');
    expect(outliers[0].repName).toBe('Venkat Mishra');
    expect(outliers[0].totalLeads).toBe(22);
    expect(outliers[0].deliveredUnits).toBe(1);
    expect(Math.round(outliers[0].conversionRate * 1000) / 10).toBe(4.5);
  });

  it('verifies pipeline health and idle ageing (§5)', () => {
    const pipeline = calculatePipelineHealth(data.leads, DATA_AS_OF);

    expect(pipeline.totalOpenLeads).toBe(62);
    expect(pipeline.totalOpenValue).toBe(151500000);

    expect(pipeline.preOrderCount).toBe(24);
    expect(pipeline.preOrderStaleCount).toBe(6);
    expect(pipeline.preOrderStaleValue).toBe(14800000);

    expect(pipeline.orderPlacedCount).toBe(38);
    expect(pipeline.orderPlacedStaleCount).toBe(33);
    expect(pipeline.orderPlacedStaleValue).toBe(76800000);
    expect(pipeline.orderPlacedAged17Count).toBe(27);
    expect(pipeline.orderPlacedAged17Value).toBe(62800000);

    expect(pipeline.combinedIdleCount).toBe(39);
    expect(pipeline.combinedIdleValue).toBe(91600000);
  });

  it('verifies delivery bottlenecks and delay reasons (§5)', () => {
    const bottlenecks = calculateDeliveryBottlenecks(data.deliveries);

    expect(bottlenecks.totalDeliveries).toBe(160);
    expect(bottlenecks.onTimeCount).toBe(88);
    expect(bottlenecks.delayedCount).toBe(72);

    const reasonsMap = Object.fromEntries(bottlenecks.reasons.map((r) => [r.reason, r.count]));
    expect(reasonsMap['customer date change']).toBe(18);
    expect(reasonsMap['logistics transit']).toBe(11);
    expect(reasonsMap['factory allocation']).toBe(11);
    expect(reasonsMap['accessory backlog']).toBe(10);
    expect(reasonsMap['finance disbursement']).toBe(9);
    expect(reasonsMap['RTO registration']).toBe(7);
    expect(reasonsMap['PDI rework']).toBe(6);
  });

  it('verifies status_history event counts and Trap 4 / 6', () => {
    const totalEvents = data.leads.reduce((sum, l) => sum + l.status_history.length, 0);
    expect(totalEvents).toBe(2068);

    const decStart = new Date('2025-12-01T00:00:00Z').getTime();
    const decEvents = data.leads.reduce((sum, l) => {
      return sum + l.status_history.filter((h) => new Date(h.timestamp).getTime() >= decStart).length;
    }, 0);
    expect(decEvents).toBe(343);

    // Trap 4: lost_reason is null for 14 lost leads
    const nullLost = data.leads.filter((l) => l.status === 'lost' && l.lost_reason === null);
    expect(nullLost.length).toBe(14);

    // Trap 6: Dissatisfied with test drive
    const tdDissat = data.leads.filter((l) => l.lost_reason === 'Dissatisfied with test drive');
    expect(tdDissat.length).toBe(28);
    const tdDissatNeverTd = tdDissat.filter(
      (l) => !l.status_history.some((h) => h.status === 'test_drive')
    );
    expect(tdDissatNeverTd.length).toBe(20);
  });
});
