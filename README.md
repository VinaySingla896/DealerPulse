# DealerPulse

Executive performance dashboard for a 5-branch automotive dealership group. It turns
seven months of raw lead, delivery, and target data into the vital signs a CEO and
branch managers need at a glance — and surfaces the specific actions that move them.

## Highlights

- **Overview** — group vital signs (delivered revenue, conversion, stalled pipeline,
  never-contacted leak, fulfilment delay), a data-derived crisis banner, the branch
  league table, the full sales funnel with stage-by-stage leak, lead-source ROI, and
  monthly-momentum / conversion-by-branch charts.
- **Pipeline & Actions** — every lead idle ≥ 7 days, split into fulfilment vs. sales
  follow-up, plus two CRM data-integrity audits, each row with a one-click action.
- **Rep League** — per-rep conversion indexed to the branch mean, statistical-outlier
  flagging (z-score), and drill-down: click a rep to see their leads, click a lead to
  see its full status-history journey.
- **Targets & Forecast** — target attainment plus a stage-weighted pipeline projection
  per branch, graded relative to the group's own pace, with the lead-supply gap
  (leads received vs. leads needed to hit target at the current close rate).
- **Fulfilment & Delays** — 45% of deliveries run late; this breaks the 72 delayed
  deliveries into OEM / dealer-operations / customer-compliance buckets with playbooks.
- **Dec Replay** — scrub through December's status transitions day by day.
- **CEO Briefing** — a print-ready board summary; every figure and directive is
  computed from the data.

Every view can be sliced by **month range**, **branch**, and **lead source**. All
headline numbers are derived from the dataset, so filtered views stay consistent and
the app works unchanged on a different dataset.

## Tech

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Zustand · Recharts · Vitest.
Data is a static JSON file processed entirely client-side — no backend, no auth.

## Run locally

**Prerequisites:** Node.js 20.19+ or 22.12+

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build to dist/
npm run preview     # serve the build
npm run lint        # tsc --noEmit
npm test            # vitest (metrics ground-truth + forecast + period filtering)
```

## Data

`public/data/dealership_data.json` — 5 branches, 30 reps, 510 leads with full status
histories, 160 deliveries, and 35 monthly branch targets (Jun–Dec 2025). Metrics are
computed in [`src/lib/metrics.ts`](src/lib/metrics.ts); the month-range filter lives in
[`src/lib/period.ts`](src/lib/period.ts).

## Deploy

Zero-config on Vercel — it detects Vite, runs `npm run build`, and serves `dist/`.
