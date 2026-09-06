import { DealershipData, Branch, SalesRep, Target, Delivery, Lead } from '../types';

export const DATA_AS_OF_STRING = '2025-12-31T19:10:00Z';
export const DATA_AS_OF = new Date(DATA_AS_OF_STRING);
export const DEC_START = new Date('2025-12-01T00:00:00Z');

let cachedData: DealershipData | null = null;

export async function loadDealershipData(): Promise<DealershipData> {
  if (cachedData) {
    return cachedData;
  }
  const response = await fetch('/data/dealership_data.json');
  if (!response.ok) {
    throw new Error(`Failed to load dealership data: ${response.statusText}`);
  }
  const data: DealershipData = await response.json();
  cachedData = data;
  return data;
}

export function setCachedData(data: DealershipData) {
  cachedData = data;
}

export function createDataIndexes(data: DealershipData) {
  const branchMap = new Map<string, Branch>();
  data.branches.forEach((b) => branchMap.set(b.id, b));

  const repMap = new Map<string, SalesRep>();
  data.sales_reps.forEach((r) => repMap.set(r.id, r));

  const deliveryMap = new Map<string, Delivery>();
  data.deliveries.forEach((d) => deliveryMap.set(d.lead_id, d));

  const leadMap = new Map<string, Lead>();
  data.leads.forEach((l) => leadMap.set(l.id, l));

  // Branch targets key: `${branch_id}_${month}`
  const targetMap = new Map<string, Target>();
  data.targets.forEach((t) => targetMap.set(`${t.branch_id}_${t.month}`, t));

  return {
    branchMap,
    repMap,
    deliveryMap,
    leadMap,
    targetMap,
  };
}

/**
 * Format currency in Indian numbering system (Lakhs and Crores)
 * e.g. 388800000 -> ₹38.88 Cr
 * e.g. 14800000 -> ₹1.48 Cr
 * e.g. 750000 -> ₹7.50 L
 */
export function formatINR(amount: number, compact: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';

  if (!compact) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const cr = abs / 10000000;
    return `${sign}₹${cr.toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    // 1 Lakh = 100,000
    const lk = abs / 100000;
    return `${sign}₹${lk.toFixed(2)} L`;
  } else if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}₹${k.toFixed(1)}k`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}

/**
 * Calculate fractional idle days from last activity relative to asOfDate
 */
export function calculateIdleDays(lastActivityAt: string, asOfDate: Date = DATA_AS_OF): number {
  const last = new Date(lastActivityAt).getTime();
  const asOf = asOfDate.getTime();
  const diffMs = asOf - last;
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Trap 4: lost_reason is null for 14 lost leads
 */
export function displayLostReason(reason: string | null | undefined): string {
  if (!reason) return 'Reason not recorded';
  return reason;
}

/**
 * Trap 4: delay_reason is null for on-time deliveries
 */
export function displayDelayReason(reason: string | null | undefined): string {
  if (!reason) return 'On time';
  return reason;
}

/**
 * Format percentage e.g. 0.314 -> "31.4%"
 */
export function formatPct(val: number, decimals: number = 1): string {
  if (isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(decimals)}%`;
}
