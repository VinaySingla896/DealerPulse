import { DealershipData, Lead } from '../types';

/**
 * Time-period (month-range) filtering for the dashboard.
 *
 * The dataset spans 7 monthly cohorts (2025-06 .. 2025-12). Every view can be
 * sliced to a contiguous range of those months. Filtering is *cohort-based*:
 * a lead belongs to a period if its `created_at` month falls inside the range.
 * Deliveries and targets are then derived from that same cohort / range so the
 * numbers stay internally consistent (see DECISIONS.md).
 */

export const ALL_MONTHS = [
  '2025-06',
  '2025-07',
  '2025-08',
  '2025-09',
  '2025-10',
  '2025-11',
  '2025-12',
] as const;

export type MonthKey = (typeof ALL_MONTHS)[number];

export const MONTH_LABELS: Record<string, string> = {
  '2025-06': 'Jun 2025',
  '2025-07': 'Jul 2025',
  '2025-08': 'Aug 2025',
  '2025-09': 'Sep 2025',
  '2025-10': 'Oct 2025',
  '2025-11': 'Nov 2025',
  '2025-12': 'Dec 2025',
};

/** ISO timestamp -> "YYYY-MM" */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export interface PeriodRange {
  /** inclusive start month, or null for "from the beginning" */
  start: string | null;
  /** inclusive end month, or null for "to the end" */
  end: string | null;
}

export const FULL_PERIOD: PeriodRange = { start: null, end: null };

export function isFullPeriod(p: PeriodRange): boolean {
  return (
    (p.start === null || p.start === ALL_MONTHS[0]) &&
    (p.end === null || p.end === ALL_MONTHS[ALL_MONTHS.length - 1])
  );
}

/** The list of month keys covered by a range (inclusive). */
export function monthsInRange(p: PeriodRange): string[] {
  const start = p.start ?? ALL_MONTHS[0];
  const end = p.end ?? ALL_MONTHS[ALL_MONTHS.length - 1];
  return ALL_MONTHS.filter((m) => m >= start && m <= end);
}

export function monthInRange(month: string, p: PeriodRange): boolean {
  const start = p.start ?? ALL_MONTHS[0];
  const end = p.end ?? ALL_MONTHS[ALL_MONTHS.length - 1];
  return month >= start && month <= end;
}

export function leadInPeriod(lead: Lead, p: PeriodRange): boolean {
  return monthInRange(monthKey(lead.created_at), p);
}

/** Human-readable label for the selected range, e.g. "Jun–Sep 2025". */
export function periodLabel(p: PeriodRange): string {
  if (isFullPeriod(p)) return 'All months (Jun–Dec 2025)';
  const months = monthsInRange(p);
  if (months.length === 0) return 'No months selected';
  if (months.length === 1) return MONTH_LABELS[months[0]];
  const first = MONTH_LABELS[months[0]].split(' ')[0];
  const last = MONTH_LABELS[months[months.length - 1]];
  return `${first}–${last}`;
}

/**
 * Return a new DealershipData scoped to the given month range.
 * - `leads`      : created_at month inside the range
 * - `deliveries` : belong to a lead that survived the lead filter
 * - `targets`    : month inside the range
 * - `branches` / `sales_reps` : untouched (used as lookup dimensions)
 */
export function scopeDataToPeriod(data: DealershipData, p: PeriodRange): DealershipData {
  if (isFullPeriod(p)) return data;

  const leads = data.leads.filter((l) => leadInPeriod(l, p));
  const leadIds = new Set(leads.map((l) => l.id));

  return {
    ...data,
    leads,
    deliveries: data.deliveries.filter((d) => leadIds.has(d.lead_id)),
    targets: data.targets.filter((t) => monthInRange(t.month, p)),
  };
}
