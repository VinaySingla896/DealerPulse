export type Branch = {
  id: string;
  name: string;
  city: string;
};

export type SalesRep = {
  id: string;
  name: string;
  branch_id: string;
  role: 'branch_manager' | 'sales_officer';
  joined: string;
};

export type Target = {
  branch_id: string;
  month: string; // "2025-06"
  target_units: number;
  target_revenue: number;
};

export type Delivery = {
  lead_id: string;
  order_date: string;
  delivery_date: string;
  days_to_deliver: number;
  delay_reason: string | null;
};

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'test_drive'
  | 'negotiation'
  | 'order_placed'
  | 'delivered'
  | 'lost';

export type LeadSource =
  | 'website'
  | 'walk_in'
  | 'referral'
  | 'social_media'
  | 'phone_enquiry'
  | 'auto_expo';

export type LeadModel =
  | 'Glanza'
  | 'Urban Cruiser Hyryder'
  | 'Fortuner'
  | 'Innova Hycross'
  | 'Innova Crysta'
  | 'Camry'
  | 'Hilux';

export type StatusHistoryEntry = {
  status: LeadStatus;
  timestamp: string; // ISO
  note: string;
};

export type Lead = {
  id: string;
  customer_name: string;
  phone: string;
  source: LeadSource;
  model_interested: LeadModel;
  status: LeadStatus;
  assigned_to: string; // -> SalesRep.id
  branch_id: string; // -> Branch.id
  created_at: string; // ISO
  last_activity_at: string; // ISO
  status_history: StatusHistoryEntry[];
  expected_close_date: string; // "2025-07-12"
  deal_value: number; // INR
  lost_reason: string | null;
};

export type DealershipData = {
  branches: Branch[];
  sales_reps: SalesRep[];
  targets: Target[];
  deliveries: Delivery[];
  leads: Lead[];
};

export type FilterState = {
  selectedBranchId: string | 'all';
  selectedSource: string | 'all';
  /** inclusive month keys ('2025-06' .. '2025-12'); null = unbounded */
  periodStart: string | null;
  periodEnd: string | null;
};

export type BranchMetrics = {
  branchId: string;
  branchName: string;
  city: string;
  totalLeads: number;
  deliveredUnits: number;
  deliveredRevenue: number;
  targetUnits: number;
  targetRevenue: number;
  attainmentUnitsPct: number;
  attainmentRevenuePct: number;
  conversionRate: number; // delivered / total
  testDriveRate: number; // reached test_drive / total
  lostRate: number;
  neverContactedCount: number;
  neverContactedRate: number;
  openLeadsCount: number;
  openPipelineValue: number;
  avgDaysToDeliver: number;
  medianDaysToDeliver: number;
};

export type RepMetrics = {
  repId: string;
  repName: string;
  branchId: string;
  branchName: string;
  role: 'branch_manager' | 'sales_officer';
  totalLeads: number;
  deliveredUnits: number;
  deliveredRevenue: number;
  conversionRate: number;
  isOutlier: boolean;
  zScore: number;
  openLeadsCount: number;
  stalledLeadsCount: number;
};

export type FunnelMetrics = {
  stage: LeadStatus;
  label: string;
  count: number;
  pctOfTotal: number;
  dropoffFromPrevPct: number;
};

export type BranchForecast = {
  branchId: string;
  branchName: string;
  city: string;
  targetUnits: number;
  targetRevenue: number;
  deliveredUnits: number;
  deliveredRevenue: number;
  attainmentUnitsPct: number;
  attainmentRevenuePct: number;
  /** open leads still in the pipeline */
  openLeadsCount: number;
  openPipelineValue: number;
  /** stage-weighted expected conversions from the open pipeline */
  expectedAdditionalUnits: number;
  expectedAdditionalRevenue: number;
  /** delivered + expected */
  projectedUnits: number;
  projectedRevenue: number;
  projectedAttainmentPct: number;
  /** target - projected (positive = shortfall) */
  unitGap: number;
  /** projected attainment relative to the group's own projected attainment (1 = at group pace) */
  vsGroupPace: number;
  status: 'ahead' | 'on_track' | 'behind' | 'at_risk';
};

export type GroupTargetSummary = {
  targetUnits: number;
  targetRevenue: number;
  deliveredUnits: number;
  deliveredRevenue: number;
  projectedUnits: number;
  attainmentPct: number;
  projectedAttainmentPct: number;
  /** leads received in the period */
  leadsReceived: number;
  groupConversion: number;
  /** leads that would be required to hit the unit target at the current group conversion rate */
  leadsNeededForTarget: number;
  /** leadsNeededForTarget - leadsReceived (positive = demand-generation shortfall) */
  leadSupplyGap: number;
};
