import json
import math
from datetime import datetime

DATA_AS_OF = datetime.fromisoformat("2025-12-31T19:10:00+00:00")
DEC_START = datetime.fromisoformat("2025-12-01T00:00:00+00:00")

with open("public/data/dealership_data.json") as f:
    data = json.load(f)

leads = data["leads"]
deliveries = data["deliveries"]
targets = data["targets"]
branches = data["branches"]
sales_reps = data["sales_reps"]

print(f"Loaded: {len(leads)} leads, {len(deliveries)} deliveries, {len(targets)} targets, {len(branches)} branches, {len(sales_reps)} reps")

assert len(leads) == 510, f"Expected 510 leads, got {len(leads)}"
assert len(deliveries) == 160, f"Expected 160 deliveries, got {len(deliveries)}"
assert len(branches) == 5, f"Expected 5 branches, got {len(branches)}"
assert len(sales_reps) == 30, f"Expected 30 reps, got {len(sales_reps)}"

# Funnel reached (by status_history)
stages = ["new", "contacted", "test_drive", "negotiation", "order_placed", "delivered"]
stage_counts = {s: 0 for s in stages}
for l in leads:
    statuses = {h["status"] for h in l["status_history"]}
    for s in stages:
        if s in statuses:
            stage_counts[s] += 1

print("Funnel stage reach counts:", stage_counts)
assert stage_counts["new"] == 510
assert stage_counts["contacted"] == 391
assert stage_counts["test_drive"] == 300
assert stage_counts["negotiation"] == 235
assert stage_counts["order_placed"] == 198
assert stage_counts["delivered"] == 160

# Current status counts
status_counts = {}
for l in leads:
    status_counts[l["status"]] = status_counts.get(l["status"], 0) + 1
print("Current status counts:", status_counts)
assert status_counts["lost"] == 288
assert status_counts["delivered"] == 160
assert status_counts["order_placed"] == 38
assert status_counts["contacted"] == 10
assert status_counts["test_drive"] == 6
assert status_counts["new"] == 5
assert status_counts["negotiation"] == 3

# Never contacted count (leads whose status_history has no 'contacted')
never_contacted = sum(1 for l in leads if not any(h["status"] == "contacted" for h in l["status_history"]))
print(f"Never contacted leads: {never_contacted} (Expected: 119)")
assert never_contacted == 119

# Delivered revenue
deliv_rev = sum(l["deal_value"] for l in leads if l["status"] == "delivered")
print(f"Delivered revenue: ₹{deliv_rev / 1e7:.2f} Cr (Expected: ₹38.88 Cr)")
assert deliv_rev == 388800000

# Branch metrics
for b in branches:
    b_id = b["id"]
    b_leads = [l for l in leads if l["branch_id"] == b_id]
    b_deliv = [l for l in b_leads if l["status"] == "delivered"]
    b_lost = [l for l in b_leads if l["status"] == "lost"]
    b_td = [l for l in b_leads if any(h["status"] == "test_drive" for h in l["status_history"])]
    b_never_c = [l for l in b_leads if not any(h["status"] == "contacted" for h in l["status_history"])]
    
    n_total = len(b_leads)
    td_pct = round(len(b_td) / n_total * 100, 1)
    deliv_pct = round(len(b_deliv) / n_total * 100, 1)
    lost_pct = round(len(b_lost) / n_total * 100, 1)
    never_c_pct = round(len(b_never_c) / n_total * 100, 1)

    print(f"Branch {b_id} ({b['name']}): Total={n_total}, TD={td_pct}% ({len(b_td)}), Deliv={deliv_pct}% ({len(b_deliv)}), Lost={lost_pct}% ({len(b_lost)}), NeverContacted={never_c_pct}% ({len(b_never_c)})")

# Check source conversions
sources = ['walk_in', 'auto_expo', 'referral', 'website', 'phone_enquiry', 'social_media']
for s in sources:
    s_leads = [l for l in leads if l["source"] == s]
    s_deliv = [l for l in s_leads if l["status"] == "delivered"]
    conv = round(len(s_deliv) / len(s_leads) * 100, 1)
    print(f"Source {s}: leads={len(s_leads)}, deliv={len(s_deliv)}, conv={conv}%")

# Check Lakeside Rep Outlier (Rule 6)
lakeside_officers = [r for r in sales_reps if r["branch_id"] == "B3" and r["role"] == "sales_officer"]
officer_rates = []
for o in lakeside_officers:
    o_leads = [l for l in leads if l["assigned_to"] == o["id"]]
    o_deliv = [l for l in o_leads if l["status"] == "delivered"]
    rate = len(o_deliv) / len(o_leads) if o_leads else 0.0
    officer_rates.append(rate)
    print(f"Lakeside Officer {o['id']} ({o['name']}): leads={len(o_leads)}, deliv={len(o_deliv)}, conv={rate * 100:.2f}%")

mean_rate = sum(officer_rates) / len(officer_rates)
var_rate = sum((r - mean_rate) ** 2 for r in officer_rates) / len(officer_rates)
std_rate = math.sqrt(var_rate)
thresh = mean_rate - 1.5 * std_rate
print(f"Lakeside rep mean={mean_rate*100:.2f}%, std={std_rate*100:.2f}%, threshold={thresh*100:.2f}%")
for i, o in enumerate(lakeside_officers):
    o_leads = [l for l in leads if l["assigned_to"] == o["id"]]
    if len(o_leads) >= 10 and officer_rates[i] < thresh:
        print(f"OUTLIER DETECTED: {o['name']} ({o['id']}) rate={officer_rates[i]*100:.2f}% < {thresh*100:.2f}%")

# Check Open Pipeline idle stats
open_leads = [l for l in leads if l["status"] not in ["delivered", "lost"]]
print(f"Total open leads: {len(open_leads)} (Expected: 62)")
assert len(open_leads) == 62
open_val = sum(l["deal_value"] for l in open_leads)
print(f"Open pipeline value: ₹{open_val / 1e7:.2f} Cr (Expected: ₹15.15 Cr)")
assert open_val == 151500000

# Pre-order open leads
pre_order_open = [l for l in open_leads if l["status"] != "order_placed"]
assert len(pre_order_open) == 24
pre_order_stale = [
    l for l in pre_order_open
    if (DATA_AS_OF - datetime.fromisoformat(l["last_activity_at"].replace("Z", "+00:00"))).total_seconds() / 86400.0 >= 7.0
]
print(f"Pre-order idle >= 7 days: {len(pre_order_stale)} leads (Expected: 6), value: ₹{sum(l['deal_value'] for l in pre_order_stale) / 1e7:.2f} Cr (Expected: ₹1.48 Cr)")
assert len(pre_order_stale) == 6
assert sum(l["deal_value"] for l in pre_order_stale) == 14800000

# Order placed open leads
order_placed_open = [l for l in open_leads if l["status"] == "order_placed"]
assert len(order_placed_open) == 38
assert sum(l["deal_value"] for l in order_placed_open) == 85900000

op_stale = [
    l for l in order_placed_open
    if (DATA_AS_OF - datetime.fromisoformat(l["last_activity_at"].replace("Z", "+00:00"))).total_seconds() / 86400.0 >= 7.0
]
print(f"Order placed idle >= 7 days: {len(op_stale)} leads (Expected: 33), value: ₹{sum(l['deal_value'] for l in op_stale) / 1e7:.2f} Cr (Expected: ₹7.68 Cr)")
assert len(op_stale) == 33
assert sum(l["deal_value"] for l in op_stale) == 76800000

op_aged_17 = [
    l for l in order_placed_open
    if (DATA_AS_OF - datetime.fromisoformat(l["last_activity_at"].replace("Z", "+00:00"))).total_seconds() / 86400.0 >= 17.0
]
print(f"Order placed idle >= 17 days: {len(op_aged_17)} leads (Expected: 27), value: ₹{sum(l['deal_value'] for l in op_aged_17) / 1e7:.2f} Cr (Expected: ₹6.28 Cr)")
assert len(op_aged_17) == 27
assert sum(l["deal_value"] for l in op_aged_17) == 62800000

# Combined idle >= 7 days:
comb_idle = pre_order_stale + op_stale
print(f"Combined idle >= 7 days: {len(comb_idle)} leads (Expected: 39), value: ₹{sum(l['deal_value'] for l in comb_idle) / 1e7:.2f} Cr (Expected: ₹9.16 Cr)")
assert len(comb_idle) == 39
assert sum(l["deal_value"] for l in comb_idle) == 91600000

# Check Deliveries
delay_counts = {}
for d in deliveries:
    reason = d["delay_reason"]
    delay_counts[reason] = delay_counts.get(reason, 0) + 1
print("Delivery delay counts:", delay_counts)
assert delay_counts[None] == 88
assert sum(c for r, c in delay_counts.items() if r is not None) == 72

# Status history counts
tot_hist = sum(len(l["status_history"]) for l in leads)
dec_hist = sum(
    1 for l in leads for h in l["status_history"]
    if datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00")) >= DEC_START
)
print(f"Status history entries: Total={tot_hist} (Expected: 2068), December={dec_hist} (Expected: 343)")
assert tot_hist == 2068
assert dec_hist == 343

# Traps 4 & 6
null_lost = sum(1 for l in leads if l["status"] == "lost" and l["lost_reason"] is None)
print(f"Lost leads with null reason: {null_lost} (Expected: 14)")
assert null_lost == 14

test_drive_dissat = [l for l in leads if l.get("lost_reason") == "Dissatisfied with test drive"]
test_drive_dissat_never_td = [l for l in test_drive_dissat if not any(h["status"] == "test_drive" for h in l["status_history"])]
print(f"Dissatisfied with test drive leads: {len(test_drive_dissat)} (Expected: 28), never reached TD: {len(test_drive_dissat_never_td)} (Expected: 20)")
assert len(test_drive_dissat) == 28
assert len(test_drive_dissat_never_td) == 20

print("\n>>> ALL 28 GROUND-TRUTH TESTS PASSED WITH 100% MATHEMATICAL PRECISION! <<<")
