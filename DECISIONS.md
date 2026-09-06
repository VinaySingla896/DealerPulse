# Decisions

Notes on what I built, why, and what I'd do differently with more time.

## The framing

The brief asks for "the vital signs of the business" and "at least one actionable
insight." So before writing any code I spent a while just reading the JSON, and the
data basically tells you what to build: there's one branch that's clearly on fire,
one rep who's a statistical outlier, a pile of leads nobody ever called, and a
month-end delivery scramble. That's the story. Everything in the dashboard is built
to get a CEO from "how are we doing" to "here's the one call to make this morning"
in as few clicks as possible.

The organising principle I kept coming back to: **every number should lead somewhere.**
A KPI that just sits there is dead weight. So the stalled-pipeline tile is clickable,
the branch league table has a "Filter" action per row, the crisis banner has buttons
that jump you straight to the rep or the stalled leads, and so on.

## What I built

Seven views, all sliceable by month range / branch / lead source:

- **Overview** — the vital signs. Delivered revenue, group conversion, stalled
  pipeline (₹), never-contacted leak, fulfilment delay rate. Below that: a
  data-derived crisis banner, the branch league table, the full sales funnel with
  per-stage drop-off, lead-source ROI, and two charts (monthly momentum, conversion
  by branch).
- **Pipeline & Actions** — every open lead idle ≥ 7 days, split into "fulfilment
  bottleneck" (order placed, waiting on a car) vs "sales follow-up" (pre-order,
  going cold), each row with a one-click action. Plus two CRM data-integrity audits
  (explained below).
- **Rep League** — per-rep conversion indexed to the branch mean, with automatic
  statistical-outlier flagging (z-score). Click a rep to see their leads; click a
  lead to expand its full status-history timeline.
- **Targets & Forecast** — target attainment plus a stage-weighted forecast of the
  open pipeline, graded relative to the group's own pace, with the lead-supply gap
  called out.
- **Fulfilment & Delays** — the 45% of deliveries that run late, bucketed into
  OEM / dealership-ops / customer-compliance with a playbook per bucket.
- **Dec Replay** — scrub through December's status transitions day by day and watch
  the month-end rush build.
- **CEO Briefing** — a print-ready board summary. Every figure and directive is
  computed from the data (see the note on "AI" below).

Mapped against the brief's optional list, that's lead aging & alerts, funnel
visualisation, forecasting, comparative analytics, and anomaly detection all covered,
plus export (print/PDF). I deliberately stopped there — the brief says "don't try to
do all of them," and a kitchen-sink dashboard works against "does it feel like a real
product."

## Key decisions and tradeoffs

### No backend

**I chose not to build a backend.** The dataset is a single ~600 KB JSON file, it
doesn't change, and there's no auth to worry about (the brief says assume the user is
the CEO). A backend would have been pure ceremony: a server that reads a file and
returns it. So the app fetches the JSON straight from `/public`, parses it once,
caches it in memory, and does every calculation client-side.

The payoff is that this deploys to Vercel for free with zero configuration — it's a
static build, no server to run, no database to provision, nothing to keep alive. For
a take-home that's exactly the right trade.

**In production this would look different.** Real dealership data lives in a CRM and a
DMS, it updates constantly, it's much larger, and you'd want proper access control
and audit logging. That version has a backend (an API that talks to a warehouse or a
read replica), a database, incremental sync, and the heavy aggregations move
server-side or into materialised views instead of running in the browser on every
render. The metrics layer I wrote (`src/lib/metrics.ts`) is deliberately just pure
functions over plain arrays, so most of that logic would port to a Node service
almost unchanged.

### All numbers are derived, nothing is hard-coded

Early on the headline figures were literals in the JSX ("₹9.16 Cr", "Venkat Mishra",
"41.8%"). That's fragile — the moment you filter to a single month, the narrative
contradicts the KPIs sitting right next to it. So everything is now computed from the
(filtered) data: the crisis banner figures out which branch is worst, names the
actual branch manager, finds the real outlier rep and their best-performing peer, and
calculates the recoverable revenue. Swap the JSON for a different dataset and the
whole briefing re-writes itself correctly. This caught a real bug — the branch manager
the briefing names changed from "Anand Kulkarni" to "Rahul Patel" once I loaded the
final dataset, because I'd been testing against a slightly different one.

### The "AI-powered summary" is deterministic, not an LLM

The CEO Briefing reads like a written memo, but there's no model call. It's a set of
hand-written sentence skeletons with `{}` slots that the data fills, plus conditionals
that pick which sentence fits (singular vs plural, alarm vs "discipline is holding",
show the crisis banner only if the worst branch is more than 40% below the group
mean). Same data always produces the same words.

I went back and forth on wiring in a real LLM. Decided against it for a take-home:
it adds an API key and a failure mode to a live demo, and for this dataset the
deterministic version says everything a summary needs to say. If this were going to
production and the ask was genuinely "natural-language summaries," I'd feed the
computed metrics to a model as structured context and let it write the prose — the
`deriveGroupHeadlines()` function already produces exactly the structured input you'd
hand it.

### Time filtering is cohort-based

"Slice by time period" is ambiguous for lifecycle data — do you mean leads *created*
in the window, or activity *in* the window? I went with cohort-by-`created_at`:
pick a month range and you're looking at the leads that came in during those months
and how far they got. It's the one interpretation where the funnel, conversion, and
rep numbers all stay internally consistent. Deliveries and targets are then scoped to
that same cohort. The tradeoff is that a June-created lead that delivers in August
still counts toward June; over the full 7-month range it nets out, and for partial
ranges I think cohort analysis is the more useful lens anyway.

### Target attainment is graded on a curve

The dataset's targets are wildly optimistic — they add up to 1,426 units over seven
months against only 510 leads received. Every branch lands around 11% of target.
Showing "all 5 branches AT RISK" as the headline looks broken and buries the signal.

So the Targets view leads with the structural finding — this is a demand-generation
gap, not a closing gap, and here's the ~4,000-lead shortfall — and then grades each
branch *relative to the group's own pace*. That correctly isolates Lakeside (running
at 26% of the group pace) as the real problem while the other four read as roughly on
track with each other. I think this is the honest way to present a target that the
business clearly isn't calibrated to hit.

### Charts: Recharts, used sparingly

Most of the dashboard is tables and CSS bars, which I think is right for dense
operational data — you want to read exact values, not eyeball a chart. Recharts shows
up in the three places where a trend or a comparison genuinely reads better as a
picture: monthly momentum, conversion-by-branch, and delivered-vs-target. It's split
into its own bundle chunk so it doesn't bloat first paint.

### Responsive

Desktop and tablet were the requirement; both work with no compromises. Phone is a
bonus but I took it reasonably far — the nav becomes a floating button that opens a
bottom-sheet menu, dense tables drop their low-priority columns, and the header stops
being sticky so it doesn't eat the screen. No view scrolls the page sideways at any
width down to 320px.

## What I'd build next

- **What-if scenarios.** The one optional direction I didn't get to. "If Lakeside's
  contact rate matched the group, that's +18 deliveries / ₹4.4 Cr" — the briefing
  already computes that number, it just isn't interactive. A couple of sliders
  (contact rate, test-drive→order conversion) with live revenue impact would be a
  strong addition and the data supports it cleanly.
- **Shareable links.** Right now the filter state lives in a Zustand store, so you
  can't send someone a URL to "Lakeside, November." Encoding filters into the query
  string is a small change with a big usefulness payoff for an exec who wants to
  forward a specific view.
- **Real AI summaries**, per the note above — structured metrics in, prose out.
- **A proper rep-level page** rather than a slide-over panel — first-response time,
  test-drive conversion, aging distribution for that one rep.
- **Alerting.** The dashboard surfaces problems when you look at it; the next step is
  it emailing the CEO on Monday when a branch crosses a threshold.
- Wire the "as of" date to `DATA_AS_OF` in one place instead of it being repeated in
  three components.

## Patterns in the data

Some of these are clearly planted, a few are just how the numbers fell out:

- **Lakeside Toyota (Bangalore) is in freefall.** 7.6% lead-to-delivery conversion
  against a group average of ~31%. But it's not a closing problem — **41.8% of
  Lakeside's leads were never contacted at all**, versus 17–22% everywhere else.
  Nearly nine in ten of its leads end up lost. This is an intake/SLA failure at the
  branch, not a skills gap.
- **One rep, SR16 (Venkat Mishra), is a genuine statistical outlier** — 4.55%
  conversion on 22 leads, more than 1.5 standard deviations below his own branch's
  mean, and he was handed the *most* leads in Bangalore. A peer in the same branch
  converts at 11% on comparable volume.
- **The biggest funnel leak is the very first step.** 23.3% of all leads (119) never
  get a phone call. After that the funnel is actually healthy — once someone takes a
  test drive, conversion to delivery is over 50%. The entire group's growth lever is
  "call every lead within two hours."
- **Lead source quality varies 3x.** Walk-ins convert at 45.7%; social-media leads at
  13.9%, on the same volume as phone enquiries. Marketing spend is going to the wrong
  channels.
- **Targets are ~9x the lead supply.** 1,426 target units, 510 leads. Either the
  targets are aspirational fiction or lead generation is running at a fifth of what
  the business plan assumes. Worth a conversation before anyone gets performance-
  managed against these.
- **Fulfilment is slow.** 45% of deliveries run late, median 17 days from order to
  handover (range 7–39). The delays split fairly evenly across things the dealer
  controls (accessory fitment, PDI rework), things the OEM controls (factory
  allocation, transit), and things the customer/bank controls (date changes, finance,
  RTO).
- **Classic month-end hockey stick.** December delivered 52 units — roughly a third of
  all 160 deliveries, and more than double a normal month (~16–24). 343 of the 2,068
  status changes across the whole period land in that final month.
- **Two deliberate CRM data-quality traps**, both handled so the UI never lies:
  - 14 lost leads have `lost_reason: null`. Shown as "Reason not recorded."
  - 20 leads were closed as "Dissatisfied with test drive" but their status history
    shows they *never had a test drive*. Reps using it as a lazy catch-all. Surfaced
    as its own audit tab.
