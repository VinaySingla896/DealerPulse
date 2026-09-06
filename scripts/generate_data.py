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
    # Lakeside (5 officers)
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

# Names and models pool
NAMES = [
    "Aarav Sharma", "Vivaan Patel", "Aditya Verma", "Vihaan Rao", "Arjun Reddy",
    "Sai Krishna", "Reyansh Gupta", "Ayaan Joshi", "Krishna Murthy", "Ishaan Nair",
    "Shaurya Singh", "Rohan Mehta", "Atharv Kulkarni", "Dhruv Sen", "Kabir Bhat",
    "Ananya Deshmukh", "Diya Pillai", "Aadhya Menon", "Ira Swaminathan", "Pari Hegde",
    "Saanvi Balaji", "Myra Iyer", "Anushka Kapoor", "Avani Raman", "Prisha Kamath",
    "Anika Chander", "Riya Sawant", "Tanvi Varma", "Navya Nambiar", "Sneha Fernandes"
]
MODELS_LIST = [
    'Glanza', 'Urban Cruiser Hyryder', 'Fortuner',
    'Innova Hycross', 'Innova Crysta', 'Camry', 'Hilux'
]

# Source lead allocation:
# walk_in: 140, social_media: 72, auto_expo: 43, referral: 83, website: 118, phone_enquiry: 54 = 510
# Delivered allocation per source:
# walk_in: 64, social_media: 10, auto_expo: 13, referral: 25, website: 33, phone_enquiry: 15 = 160

# Let's write the full generator in python and assert everything before outputting!
print("Beginning synthesis...")
