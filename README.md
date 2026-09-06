# DealerPulse

An executive performance dashboard for a five-branch automotive dealership group. It
takes seven months of raw lead, delivery, and target data and turns it into the vital
signs a CEO and branch managers need at a glance — plus the specific actions worth
taking this week.

Built as a take-home assignment. See **[DECISIONS.md](DECISIONS.md)** for the
reasoning behind what's here.

---

## Quick start

**You need [Node.js](https://nodejs.org) 20.19+ or 22.12+.** Check with `node -v`.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. That's it — no environment variables, no database, no
backend to start.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload at `localhost:3000` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm test` | Run the unit tests (`vitest`) |

---

## What's in it

Seven views, each sliceable by **month range**, **branch**, and **lead source** (top
of the page):

| View | What it answers |
| --- | --- |
| **Overview** | How's the business? Revenue, conversion, stalled pipeline, the never-contacted leak, fulfilment delays — plus the sales funnel, lead-source ROI, and trend charts. |
| **Pipeline & Actions** | Which deals are going cold? Every lead idle ≥ 7 days, split into "waiting on a car" vs "sales dropped the ball," each with a one-click action. Plus two CRM data-quality audits. |
| **Rep League** | How do reps stack up? Conversion indexed to the branch mean, automatic statistical-outlier flagging. Click a rep → their leads. Click a lead → its full journey. |
| **Targets & Forecast** | Will branches hit target? Attainment plus a stage-weighted forecast of the open pipeline, and the lead-supply gap. |
| **Fulfilment & Delays** | Why are deliveries late? The 45% that run late, bucketed by who's accountable (dealer / OEM / customer) with a playbook each. |
| **Dec Replay** | Step through December's activity day by day and watch the month-end delivery rush build. |
| **CEO Briefing** | A print-ready board summary of group health with the week's priority directives. |

---

## How it works

```
public/data/dealership_data.json   ← the only data source
        │  fetched once on load, cached in memory
        ▼
src/lib/data.ts        loading + Indian-currency / percent formatting
src/lib/metrics.ts     all the analytics — pure functions over plain arrays
src/lib/period.ts      the month-range ("time period") filter
        │
        ▼
src/store/useDashboardStore.ts   current view + active filters (Zustand)
        │
        ▼
src/components/*.tsx    one file per view, + charts.tsx (Recharts)
src/App.tsx            scopes the data to the active period, routes to the view
```

There is **no server**. The JSON is served as a static file, parsed in the browser,
and every metric is calculated client-side. This keeps deployment free and
zero-config; [DECISIONS.md](DECISIONS.md#no-backend) explains the trade and what a
production version would change.

### The dataset

`public/data/dealership_data.json` — synthetic data for June–December 2025:

- **5 branches** (Chennai ×2, Bangalore, Hyderabad, Mumbai)
- **30 sales reps** — 5 branch managers + 25 sales officers
- **510 leads**, each with a full `status_history` (new → contacted → test drive →
  negotiation → order placed → delivered / lost) so any lead's journey can be
  reconstructed
- **160 deliveries** with timelines and delay reasons
- **35 monthly branch targets** (units + revenue)

The dashboard treats **31 Dec 2025, 19:10 UTC** as "now" (set in
[`src/lib/data.ts`](src/lib/data.ts)) — that's what "idle days" and the aging alerts
are measured against.

### Swapping the data

Drop a file with the same shape at `public/data/dealership_data.json` and reload.
Nothing else needs to change — branch names, the crisis branch, the outlier rep, the
briefing prose, and the charts all recompute. The unit tests in
[`src/__tests__/metrics.test.ts`](src/__tests__/metrics.test.ts) assert the current
dataset's ground-truth numbers, so update those if you change the data.

---

## Tech

- **React 19** + **TypeScript**, **Vite 6** for the build
- **Tailwind CSS 4** for styling
- **Zustand** for view/filter state
- **Recharts** for the three trend/comparison charts (lazy-loaded into its own chunk)
- **Vitest** — 13 tests covering the metrics layer (funnel, branch/rep metrics,
  pipeline health, delivery bottlenecks, the forecast, and the period filter)

No backend, no auth, no environment variables.

---

## Responsive

Desktop and tablet are fully supported. On phones the navigation collapses into a
floating menu button, dense tables drop their lower-priority columns, and no view
scrolls the page sideways down to 320px wide.

---

## Deploy

Zero-config on **Vercel** — it auto-detects Vite, runs `npm run build`, and serves
`dist/` as a static site. Push the repo, import it, done. Any static host works the
same way (`npm run build` → serve `dist/`).
