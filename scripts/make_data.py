import json
import math
from datetime import datetime, timedelta

DATA_AS_OF_STR = "2025-12-31T19:10:00Z"
DATA_AS_OF = datetime.fromisoformat("2025-12-31T19:10:00+00:00")
DEC_START = datetime.fromisoformat("2025-12-01T00:00:00+00:00")
JUNE_START = datetime.fromisoformat("2025-06-01T09:00:00+00:00")

# 1. Branches
branches = [
    {"id": "B1", "name": "Downtown Toyota", "city": "Chennai"},
    {"id": "B2", "name": "Highway Toyota", "city": "Chennai"},
    {"id": "B3", "name": "Lakeside Toyota", "city": "Bangalore"},
    {"id": "B4", "name": "Central Toyota", "city": "Hyderabad"},
    {"id": "B5", "name": "Eastside Toyota", "city": "Mumbai"},
]

# 2. Sales Reps
sales_reps = [
    {"id": "BM1", "name": "Rajesh Sharma", "branch_id": "B1", "role": "branch_manager", "joined": "2023-01-15"},
    {"id": "BM2", "name": "Suresh Nair", "branch_id": "B2", "role": "branch_manager", "joined": "2023-03-10"},
    {"id": "BM3", "name": "Anand Kulkarni", "branch_id": "B3", "role": "branch_manager", "joined": "2023-02-20"},
    {"id": "BM4", "name": "Vikram Reddy", "branch_id": "B4", "role": "branch_manager", "joined": "2023-04-05"},
    {"id": "BM5", "name": "Pradeep Mehta", "branch_id": "B5", "role": "branch_manager", "joined": "2023-01-25"},
    # Downtown (6 officers)
    {"id": "SR01", "name": "Karthik Raja", "branch_id": "B1", "role": "sales_officer", "joined": "2023-06-01"},
    {"id": "SR02", "name": "Deepak Kumar", "branch_id": "B1", "role": "sales_officer", "joined": "2023-08-12"},
    {"id": "SR03", "name": "Meera Iyer", "branch_id": "B1", "role": "sales_officer", "joined": "2023-11-04"},
    {"id": "SR04", "name": "Praveen Chandran", "branch_id": "B1", "role": "sales_officer", "joined": "2024-01-18"},
    {"id": "SR05", "name": "Sneha Ranganathan", "branch_id": "B1", "role": "sales_officer", "joined": "2024-03-22"},
    {"id": "SR06", "name": "Arun Balaji", "branch_id": "B1", "role": "sales_officer", "joined": "2024-05-15"},
    # Highway (5 officers)
    {"id": "SR07", "name": "Manoj Pillai", "branch_id": "B2", "role": "sales_officer", "joined": "2023-05-20"},
    {"id": "SR08", "name": "Divya Swaminathan", "branch_id": "B2", "role": "sales_officer", "joined": "2023-09-14"},
    {"id": "SR09", "name": "Sanjay Venkatesh", "branch_id": "B2", "role": "sales_officer", "joined": "2023-10-30"},
    {"id": "SR10", "name": "Pooja Krishnan", "branch_id": "B2", "role": "sales_officer", "joined": "2024-02-10"},
    {"id": "SR11", "name": "Vijay Raman", "branch_id": "B2", "role": "sales_officer", "joined": "2024-04-01"},
    # Lakeside (5 officers) - Note: SR16 Venkat Mishra!
    {"id": "SR12", "name": "Rahul Deshmukh", "branch_id": "B3", "role": "sales_officer", "joined": "2023-07-10"},
    {"id": "SR13", "name": "Ananya Hegde", "branch_id": "B3", "role": "sales_officer", "joined": "2023-08-25"},
    {"id": "SR14", "name": "Girish Gowda", "branch_id": "B3", "role": "sales_officer", "joined": "2023-12-05"},
    {"id": "SR15", "name": "Varun Kamath", "branch_id": "B3", "role": "sales_officer", "joined": "2024-02-18"},
    {"id": "SR16", "name": "Venkat Mishra", "branch_id": "B3", "role": "sales_officer", "joined": "2024-03-01"},
    # Central (4 officers)
    {"id": "SR17", "name": "Siddharth Rao", "branch_id": "B4", "role": "sales_officer", "joined": "2023-06-15"},
    {"id": "SR18", "name": "Kavitha Chander", "branch_id": "B4", "role": "sales_officer", "joined": "2023-10-10"},
    {"id": "SR19", "name": "Akhil Varma", "branch_id": "B4", "role": "sales_officer", "joined": "2024-01-08"},
    {"id": "SR20", "name": "Swathi Nambiar", "branch_id": "B4", "role": "sales_officer", "joined": "2024-04-12"},
    # Eastside (5 officers)
    {"id": "SR21", "name": "Nikhil Shah", "branch_id": "B5", "role": "sales_officer", "joined": "2023-05-10"},
    {"id": "SR22", "name": "Priyanka Joshi", "branch_id": "B5", "role": "sales_officer", "joined": "2023-07-28"},
    {"id": "SR23", "name": "Rohan Fernandes", "branch_id": "B5", "role": "sales_officer", "joined": "2023-11-19"},
    {"id": "SR24", "name": "Tanvi Sawant", "branch_id": "B5", "role": "sales_officer", "joined": "2024-02-04"},
    {"id": "SR25", "name": "Aditya Kulkarni", "branch_id": "B5", "role": "sales_officer", "joined": "2024-04-20"},
]

# 3. Targets
targets = []
months = ["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"]
base_targets = {
    "B1": [38, 40, 42, 44, 45, 46, 48],
    "B2": [35, 36, 38, 40, 40, 42, 43],
    "B3": [35, 36, 38, 40, 40, 40, 42],
    "B4": [30, 32, 34, 35, 35, 36, 37],
    "B5": [38, 40, 42, 44, 46, 46, 48],
}
for b_id, unit_list in base_targets.items():
    for m, u in zip(months, unit_list):
        targets.append({
            "branch_id": b_id,
            "month": m,
            "target_units": u,
            "target_revenue": u * 2430000
        })

# Names pool
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Rohan", "Atharv", "Dhruv", "Kabir", "Ananya",
    "Diya", "Aadhya", "Ira", "Pari", "Saanvi", "Myra", "Anushka", "Avani", "Prisha",
    "Anika", "Riya", "Tanvi", "Navya", "Sneha", "Vikram", "Gautam", "Manish", "Rajesh",
    "Suresh", "Ramesh", "Pooja", "Sunita", "Deepika", "Kavita", "Sanjay", "Vinod"
]
LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Rao", "Reddy", "Krishna", "Gupta", "Joshi", "Murthy",
    "Nair", "Singh", "Mehta", "Kulkarni", "Sen", "Bhat", "Deshmukh", "Pillai", "Menon",
    "Swaminathan", "Hegde", "Balaji", "Iyer", "Kapoor", "Raman", "Kamath", "Chander",
    "Sawant", "Varma", "Nambiar", "Fernandes", "Choudhury", "Bose", "Das", "Ghosh"
]

MODELS_LIST = [
    'Glanza', 'Urban Cruiser Hyryder', 'Fortuner',
    'Innova Hycross', 'Innova Crysta', 'Camry', 'Hilux'
]

# Source pools
sources_delivered_pool = (
    ["walk_in"] * 64 +
    ["auto_expo"] * 13 +
    ["referral"] * 25 +
    ["website"] * 33 +
    ["phone_enquiry"] * 15 +
    ["social_media"] * 10
)
sources_non_delivered_pool = (
    ["walk_in"] * (140 - 64) +
    ["auto_expo"] * (43 - 13) +
    ["referral"] * (83 - 25) +
    ["website"] * (118 - 33) +
    ["phone_enquiry"] * (54 - 15) +
    ["social_media"] * (72 - 10)
)

delay_reasons_pool = (
    ['customer date change'] * 18 +
    ['logistics transit'] * 11 +
    ['factory allocation'] * 11 +
    ['accessory backlog'] * 10 +
    ['finance disbursement'] * 9 +
    ['RTO registration'] * 7 +
    ['PDI rework'] * 6 +
    [None] * 88
)

days_pool = []
for i in range(80):
    days_pool.append(7 + (i * 10) // 80)
for i in range(80):
    days_pool.append(17 + (i * 22) // 79)
days_pool.sort()

dec_values = [2350000] * 52
dec_values[-1] += (122300000 - sum(dec_values))
pre_dec_values = [2467000] * 108
pre_dec_values[-1] += (266500000 - sum(pre_dec_values))

v_pre_order_stale = [2460000] * 6
v_pre_order_stale[-1] += (14800000 - sum(v_pre_order_stale))

v_pre_order_fresh = [2820000] * 18
v_pre_order_fresh[-1] += (50800000 - sum(v_pre_order_fresh))

v_op_aged = [2325000] * 27
v_op_aged[-1] += (62800000 - sum(v_op_aged))

v_op_stale_mid = [2330000] * 6
v_op_stale_mid[-1] += (14000000 - sum(v_op_stale_mid))

v_op_fresh = [1820000] * 5
v_op_fresh[-1] += (9100000 - sum(v_op_fresh))

v_lost = [2200000] * 288

# Exact branch specifications:
# (branch_id, n_total, n_deliv, n_lost, n_op, n_c, n_td, n_neg, n_new, n_never_cont, n_td_reached, n_deliv_dec, n_lost_neg, n_lost_td)
# Total reached negotiation in lost across all branches = 34.
# Total reached test_drive (and stopped at test_drive) in lost = 59.
# Total reached contacted (and stopped at contacted) in lost = 81.
# Total lost at new = 114. (of which 14 have reason not recorded and 1 history event).
branch_specs = [
    # B1 Downtown (97 leads: 40 deliv, 48 lost, 6 op, 1 c, 1 td, 0 neg, 1 new. Never cont: 17, TD reached: 69, Dec deliv: 19)
    # Reached TD from deliv+op+neg+td = 40 + 6 + 0 + 1 = 47.
    # So lost reaching TD = 69 - 47 = 22. Let lost reaching neg = 8, lost at td = 14.
    ("B1", 97, 40, 48, 6, 1, 1, 0, 1, 17, 69, 19, 8, 14),
    
    # B2 Highway (109 leads: 36 deliv, 57 lost, 11 op, 2 c, 1 td, 1 neg, 1 new. Never cont: 23, TD reached: 64, Dec deliv: 11)
    # Reached TD from deliv+op+neg+td = 36 + 11 + 1 + 1 = 49.
    # So lost reaching TD = 64 - 49 = 15. Let lost reaching neg = 6, lost at td = 9.
    ("B2", 109, 36, 57, 11, 2, 1, 1, 1, 23, 64, 11, 6, 9),
    
    # B3 Lakeside (79 leads: 6 deliv, 69 lost, 2 op, 1 c, 0 td, 0 neg, 1 new. Never cont: 33, TD reached: 27, Dec deliv: 2)
    # Reached TD from deliv+op+neg+td = 6 + 2 + 0 + 0 = 8.
    # So lost reaching TD = 27 - 8 = 19. Let lost reaching neg = 4, lost at td = 15.
    ("B3", 79, 6, 69, 2, 1, 0, 0, 1, 33, 27, 2, 4, 15),
    
    # B4 Central (98 leads: 31 deliv, 50 lost, 10 op, 3 c, 2 td, 1 neg, 1 new. Never cont: 18, TD reached: 64, Dec deliv: 8)
    # Reached TD from deliv+op+neg+td = 31 + 10 + 1 + 2 = 44.
    # So lost reaching TD = 64 - 44 = 20. Let lost reaching neg = 8, lost at td = 12.
    ("B4", 98, 31, 50, 10, 3, 2, 1, 1, 18, 64, 8, 8, 12),
    
    # B5 Eastside (127 leads: 47 deliv, 64 lost, 9 op, 3 c, 2 td, 1 neg, 1 new. Never cont: 28, TD reached: 76, Dec deliv: 12)
    # Reached TD from deliv+op+neg+td = 47 + 9 + 1 + 2 = 59.
    # So lost reaching TD = 76 - 59 = 17. Let lost reaching neg = 8, lost at td = 9.
    ("B5", 127, 47, 64, 9, 3, 2, 1, 1, 28, 76, 12, 8, 9),
]

# Check totals:
# lost reaching neg: 8 + 6 + 4 + 8 + 8 = 34!
# lost at td: 14 + 9 + 15 + 12 + 9 = 59!
# total lost reaching td = 34 + 59 = 93!

leads = []
deliveries = []

lead_counter = 1
deliv_idx = 0
non_deliv_idx = 0
dec_val_idx = 0
pre_dec_val_idx = 0

stale_pre_order_idx = 0
fresh_pre_order_idx = 0
aged_op_idx = 0
mid_op_idx = 0
fresh_op_idx = 0
lost_val_idx = 0

b3_deliv_reps = ["SR16", "SR12", "SR13", "SR14", "SR15", "SR15"]
b3_non_deliv_reps = (["SR16"] * 21 + ["SR12"] * 11 + ["SR13"] * 12 +
                     ["SR14"] * 13 + ["SR15"] * 16)
b3_deliv_idx = 0
b3_non_deliv_idx = 0

def get_rep_for_lead(b_id, is_deliv, b_lead_idx, b_total_deliv):
    global b3_deliv_idx, b3_non_deliv_idx
    if b_id == "B3":
        if is_deliv:
            rep = b3_deliv_reps[b3_deliv_idx]
            b3_deliv_idx += 1
            return rep
        else:
            rep = b3_non_deliv_reps[b3_non_deliv_idx]
            b3_non_deliv_idx += 1
            return rep
    else:
        officers = [r["id"] for r in sales_reps if r["branch_id"] == b_id and r["role"] == "sales_officer"]
        return officers[b_lead_idx % len(officers)]

for spec in branch_specs:
    b_id, n_total, n_deliv, n_lost, n_op, n_c, n_td, n_neg, n_new, n_never_cont, n_td_reached, n_deliv_dec, n_lost_reached_neg, n_lost_at_td = spec
    
    n_lost_at_new = n_never_cont - n_new
    n_lost_at_contacted = n_lost - (n_lost_at_new + n_lost_at_td + n_lost_reached_neg)
    assert n_lost_at_contacted >= 0

    # 1. Delivered
    for i in range(n_deliv):
        lead_id = f"LD{lead_counter:04d}"
        lead_counter += 1
        source = sources_delivered_pool[deliv_idx]
        deliv_idx += 1
        rep_id = get_rep_for_lead(b_id, True, i, n_deliv)
        is_dec = (i < n_deliv_dec)
        if is_dec:
            deal_val = dec_values[dec_val_idx]
            dec_val_idx += 1
            deliv_dt = DEC_START + timedelta(days=2 + (i * 27) // n_deliv_dec, hours=14)
        else:
            deal_val = pre_dec_values[pre_dec_val_idx]
            pre_dec_val_idx += 1
            deliv_dt = JUNE_START + timedelta(days=15 + (i * 150) // (n_deliv - n_deliv_dec), hours=12)

        days_to_deliv = days_pool[len(deliveries)]
        delay_reason = delay_reasons_pool[len(deliveries)]
        order_dt = deliv_dt - timedelta(days=days_to_deliv)
        neg_dt = order_dt - timedelta(days=4)
        td_dt = neg_dt - timedelta(days=4)
        contacted_dt = td_dt - timedelta(days=3)
        created_dt = contacted_dt - timedelta(hours=4)

        hist = [
            {"status": "new", "timestamp": created_dt.isoformat().replace("+00:00", "Z"), "note": "Lead received"},
            {"status": "contacted", "timestamp": contacted_dt.isoformat().replace("+00:00", "Z"), "note": "Customer contacted"},
            {"status": "test_drive", "timestamp": td_dt.isoformat().replace("+00:00", "Z"), "note": "Test drive completed"},
            {"status": "negotiation", "timestamp": neg_dt.isoformat().replace("+00:00", "Z"), "note": "Commercial offer discussed"},
            {"status": "order_placed", "timestamp": order_dt.isoformat().replace("+00:00", "Z"), "note": "Booking advance received"},
            {"status": "delivered", "timestamp": deliv_dt.isoformat().replace("+00:00", "Z"), "note": "Vehicle delivered"}
        ]

        leads.append({
            "id": lead_id,
            "customer_name": f"{FIRST_NAMES[(lead_counter * 3) % len(FIRST_NAMES)]} {LAST_NAMES[(lead_counter * 5) % len(LAST_NAMES)]}",
            "phone": f"+91 98{lead_counter:08d}"[:15],
            "source": source,
            "model_interested": MODELS_LIST[lead_counter % len(MODELS_LIST)],
            "status": "delivered",
            "assigned_to": rep_id,
            "branch_id": b_id,
            "created_at": created_dt.isoformat().replace("+00:00", "Z"),
            "last_activity_at": deliv_dt.isoformat().replace("+00:00", "Z"),
            "status_history": hist,
            "expected_close_date": deliv_dt.strftime("%Y-%m-%d"),
            "deal_value": deal_val,
            "lost_reason": None
        })

        deliveries.append({
            "lead_id": lead_id,
            "order_date": order_dt.strftime("%Y-%m-%d"),
            "delivery_date": deliv_dt.strftime("%Y-%m-%d"),
            "days_to_deliver": days_to_deliv,
            "delay_reason": delay_reason
        })

    # 2. Open Order Placed
    for i in range(n_op):
        lead_id = f"LD{lead_counter:04d}"
        lead_counter += 1
        source = sources_non_delivered_pool[non_deliv_idx]
        non_deliv_idx += 1
        rep_id = get_rep_for_lead(b_id, False, i, 0)
        
        if aged_op_idx < 27:
            deal_val = v_op_aged[aged_op_idx]
            aged_op_idx += 1
            idle_days = 18.0 + (aged_op_idx % 12)
        elif mid_op_idx < 6:
            deal_val = v_op_stale_mid[mid_op_idx]
            mid_op_idx += 1
            idle_days = 8.5 + (mid_op_idx % 7)
        else:
            deal_val = v_op_fresh[fresh_op_idx]
            fresh_op_idx += 1
            idle_days = 2.5 + (fresh_op_idx % 4)

        order_dt = DATA_AS_OF - timedelta(days=idle_days)
        neg_dt = order_dt - timedelta(days=3)
        td_dt = neg_dt - timedelta(days=4)
        contacted_dt = td_dt - timedelta(days=3)
        created_dt = contacted_dt - timedelta(hours=5)

        hist = [
            {"status": "new", "timestamp": created_dt.isoformat().replace("+00:00", "Z"), "note": "Lead created"},
            {"status": "contacted", "timestamp": contacted_dt.isoformat().replace("+00:00", "Z"), "note": "Customer enquiry answered"},
            {"status": "test_drive", "timestamp": td_dt.isoformat().replace("+00:00", "Z"), "note": "Test drive arranged"},
            {"status": "negotiation", "timestamp": neg_dt.isoformat().replace("+00:00", "Z"), "note": "Pricing options reviewed"},
            {"status": "order_placed", "timestamp": order_dt.isoformat().replace("+00:00", "Z"), "note": "Booking deposit confirmed"}
        ]

        leads.append({
            "id": lead_id,
            "customer_name": f"{FIRST_NAMES[(lead_counter * 3) % len(FIRST_NAMES)]} {LAST_NAMES[(lead_counter * 5) % len(LAST_NAMES)]}",
            "phone": f"+91 98{lead_counter:08d}"[:15],
            "source": source,
            "model_interested": MODELS_LIST[lead_counter % len(MODELS_LIST)],
            "status": "order_placed",
            "assigned_to": rep_id,
            "branch_id": b_id,
            "created_at": created_dt.isoformat().replace("+00:00", "Z"),
            "last_activity_at": order_dt.isoformat().replace("+00:00", "Z"),
            "status_history": hist,
            "expected_close_date": (order_dt + timedelta(days=15)).strftime("%Y-%m-%d"),
            "deal_value": deal_val,
            "lost_reason": None
        })

    # 3. Open Pre-order
    open_pre_order_items = (
        [("contacted", 2)] * n_c +
        [("test_drive", 3)] * n_td +
        [("negotiation", 4)] * n_neg +
        [("new", 1)] * n_new
    )
    for st, depth in open_pre_order_items:
        lead_id = f"LD{lead_counter:04d}"
        lead_counter += 1
        source = sources_non_delivered_pool[non_deliv_idx]
        non_deliv_idx += 1
        rep_id = get_rep_for_lead(b_id, False, lead_counter, 0)

        if stale_pre_order_idx < 6:
            deal_val = v_pre_order_stale[stale_pre_order_idx]
            stale_pre_order_idx += 1
            idle_days = 7.5 + (stale_pre_order_idx % 8)
        else:
            deal_val = v_pre_order_fresh[fresh_pre_order_idx]
            fresh_pre_order_idx += 1
            idle_days = 1.0 + (fresh_pre_order_idx % 5)

        last_dt = DATA_AS_OF - timedelta(days=idle_days)
        hist = []
        curr_t = last_dt - timedelta(days=(depth - 1) * 3)
        statuses_seq = ["new", "contacted", "test_drive", "negotiation"]
        for s_idx in range(depth):
            step_t = curr_t + timedelta(days=s_idx * 3)
            hist.append({
                "status": statuses_seq[s_idx],
                "timestamp": step_t.isoformat().replace("+00:00", "Z"),
                "note": f"Lead advanced to {statuses_seq[s_idx]}"
            })

        leads.append({
            "id": lead_id,
            "customer_name": f"{FIRST_NAMES[(lead_counter * 3) % len(FIRST_NAMES)]} {LAST_NAMES[(lead_counter * 5) % len(LAST_NAMES)]}",
            "phone": f"+91 98{lead_counter:08d}"[:15],
            "source": source,
            "model_interested": MODELS_LIST[lead_counter % len(MODELS_LIST)],
            "status": st,
            "assigned_to": rep_id,
            "branch_id": b_id,
            "created_at": hist[0]["timestamp"],
            "last_activity_at": hist[-1]["timestamp"],
            "status_history": hist,
            "expected_close_date": (last_dt + timedelta(days=10)).strftime("%Y-%m-%d"),
            "deal_value": deal_val,
            "lost_reason": None
        })

    # 4. Lost leads
    lost_items = (
        [("new", 1)] * n_lost_at_new +
        [("contacted", 2)] * n_lost_at_contacted +
        [("test_drive", 3)] * n_lost_at_td +
        [("negotiation", 4)] * n_lost_reached_neg
    )
    for max_reached_st, depth in lost_items:
        lead_id = f"LD{lead_counter:04d}"
        lead_counter += 1
        source = sources_non_delivered_pool[non_deliv_idx]
        non_deliv_idx += 1
        rep_id = get_rep_for_lead(b_id, False, lead_counter, 0)
        deal_val = v_lost[lost_val_idx]
        lost_val_idx += 1

        lost_dt = JUNE_START + timedelta(days=30 + (lead_counter * 17) % 170, hours=15)
        created_dt = lost_dt - timedelta(days=depth * 3)
        
        hist = []
        statuses_seq = ["new", "contacted", "test_drive", "negotiation"]
        for s_idx in range(depth):
            step_t = created_dt + timedelta(days=s_idx * 3)
            hist.append({
                "status": statuses_seq[s_idx],
                "timestamp": step_t.isoformat().replace("+00:00", "Z"),
                "note": f"Status update: {statuses_seq[s_idx]}"
            })
        
        # We will append {"status": "lost"} for all except 14 lost leads that have null lost_reason
        hist.append({
            "status": "lost",
            "timestamp": lost_dt.isoformat().replace("+00:00", "Z"),
            "note": "Lead closed as lost"
        })

        leads.append({
            "id": lead_id,
            "customer_name": f"{FIRST_NAMES[(lead_counter * 3) % len(FIRST_NAMES)]} {LAST_NAMES[(lead_counter * 5) % len(LAST_NAMES)]}",
            "phone": f"+91 98{lead_counter:08d}"[:15],
            "source": source,
            "model_interested": MODELS_LIST[lead_counter % len(MODELS_LIST)],
            "status": "lost",
            "assigned_to": rep_id,
            "branch_id": b_id,
            "created_at": hist[0]["timestamp"],
            "last_activity_at": hist[-1]["timestamp"],
            "status_history": hist,
            "expected_close_date": lost_dt.strftime("%Y-%m-%d"),
            "deal_value": deal_val,
            "lost_reason": None,
            "_max_reached": max_reached_st
        })

lost_leads = [l for l in leads if l["status"] == "lost"]
assert len(lost_leads) == 288

# Exactly 14 lost leads (all from n_lost_at_new) have lost_reason = None and only 1 history entry (no 'lost' entry, bringing entries from 2082 to 2068)
lost_at_new_leads = [l for l in lost_leads if l["_max_reached"] == "new"]
assert len(lost_at_new_leads) == 114
for l in lost_at_new_leads[:14]:
    l["lost_reason"] = None
    l["status_history"] = l["status_history"][:1] # keep only 'new'
    l["last_activity_at"] = l["status_history"][0]["timestamp"]

# 28 "Dissatisfied with test drive"
# Exactly 20 never reached test drive (10 from contacted, 10 from new)
lost_at_contacted_leads = [l for l in lost_leads if l["_max_reached"] == "contacted"]
for l in lost_at_contacted_leads[:10]:
    l["lost_reason"] = "Dissatisfied with test drive"
for l in lost_at_new_leads[14:24]:
    l["lost_reason"] = "Dissatisfied with test drive"

# Exactly 8 did reach test drive
lost_at_td_or_neg = [l for l in lost_leads if l["_max_reached"] in ["test_drive", "negotiation"]]
for l in lost_at_td_or_neg[:8]:
    l["lost_reason"] = "Dissatisfied with test drive"

# 59 contact-dependent reasons on leads that died at new
never_contacted_rem = [l for l in lost_at_new_leads[24:] if l.get("lost_reason") is None]
contact_dependent_reasons = ["Price too high", "Bought competitor brand", "Finance rejected", "Customer not interested"]
for i, l in enumerate(never_contacted_rem[:59]):
    l["lost_reason"] = contact_dependent_reasons[i % len(contact_dependent_reasons)]

# The rest have standard reasons
other_reasons = ["Price too high", "Bought competitor brand", "Finance rejected", "Waiting for new model", "Changed mind"]
rem_idx = 0
for l in lost_leads:
    if l.get("lost_reason") is None and l not in lost_at_new_leads[:14]:
        l["lost_reason"] = other_reasons[rem_idx % len(other_reasons)]
        rem_idx += 1

for l in leads:
    if "_max_reached" in l:
        del l["_max_reached"]

# Check total events
total_events = sum(len(l["status_history"]) for l in leads)
print(f"Total events: {total_events} (Target: 2068)")
assert total_events == 2068

# Adjust December events to exactly 343 without changing funnel stages
dec_events = sum(
    1 for l in leads for h in l["status_history"]
    if datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00")) >= DEC_START
)
print(f"Current December events: {dec_events}")
dec_diff = dec_events - 343
if dec_diff > 0:
    # Shift dec_diff history timestamps from Dec to Nov 28
    shifted = 0
    for l in leads:
        for h in l["status_history"]:
            dt = datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00"))
            if dt >= DEC_START and shifted < dec_diff:
                # Don't shift delivery event if delivered in Dec
                if not (l["status"] == "delivered" and h["status"] == "delivered"):
                    h["timestamp"] = "2025-11-28T11:00:00Z"
                    shifted += 1
            if shifted >= dec_diff:
                break
        if shifted >= dec_diff:
            break
elif dec_diff < 0:
    shifted = 0
    for l in leads:
        for h in l["status_history"]:
            dt = datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00"))
            if dt < DEC_START and dt >= datetime.fromisoformat("2025-11-15T00:00:00+00:00") and shifted < abs(dec_diff):
                h["timestamp"] = "2025-12-05T11:00:00Z"
                shifted += 1
            if shifted >= abs(dec_diff):
                break
        if shifted >= abs(dec_diff):
            break

# Ensure last_activity_at and created_at match history
for l in leads:
    l["created_at"] = l["status_history"][0]["timestamp"]
    l["last_activity_at"] = l["status_history"][-1]["timestamp"]

final_total_events = sum(len(l["status_history"]) for l in leads)
final_dec_events = sum(
    1 for l in leads for h in l["status_history"]
    if datetime.fromisoformat(h["timestamp"].replace("Z", "+00:00")) >= DEC_START
)
print(f"Final total events: {final_total_events} (Target: 2068)")
print(f"Final Dec events: {final_dec_events} (Target: 343)")

dataset = {
    "branches": branches,
    "sales_reps": sales_reps,
    "targets": targets,
    "deliveries": deliveries,
    "leads": leads
}

with open("public/data/dealership_data.json", "w") as f:
    json.dump(dataset, f, indent=2)

print("Saved public/data/dealership_data.json successfully!")
