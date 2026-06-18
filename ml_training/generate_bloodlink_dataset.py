import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)

# ─── CONFIG ───────────────────────────────────────────────────────────────────
N_DONORS = 1200
blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
bg_weights =  [0.28, 0.05, 0.20, 0.04, 0.30, 0.06, 0.05, 0.02]

cities = ['Rawalpindi', 'Islamabad']
city_weights = [0.55, 0.45]

areas = {
    'Rawalpindi': ['Saddar', 'Raja Bazaar', 'Chaklala', 'Bahria Town', 'Gulraiz', 'Dhoke Kala Khan', 'Westridge', 'Adiala Road'],
    'Islamabad':  ['F-10', 'G-11', 'F-7', 'G-9', 'I-8', 'Blue Area', 'DHA Phase-2', 'Bani Gala']
}

lat_base = {'Rawalpindi': 33.597, 'Islamabad': 33.720}
lon_base = {'Rawalpindi': 73.046, 'Islamabad': 73.065}

# ─── GENERATE DONORS DATASET ──────────────────────────────────────────────────
records = []
for i in range(N_DONORS):
    city     = random.choices(cities, city_weights)[0]
    area     = random.choice(areas[city])
    bg       = random.choices(blood_groups, bg_weights)[0]
    age      = int(np.random.normal(32, 9))
    age      = max(18, min(60, age))
    gender   = random.choices(['Male', 'Female'], [0.62, 0.38])[0]
    
    donations = max(0, int(np.random.exponential(4)))
    donations = min(donations, 40)
    
    streak    = min(donations, max(0, int(np.random.poisson(1.8))))
    
    # Last donation: 0-730 days ago  (730 = ~2 years)
    last_days = int(np.random.exponential(120))
    last_days = max(0, min(730, last_days))
    last_donation = (datetime.today() - timedelta(days=last_days)).strftime('%Y-%m-%d')
    
    lat = lat_base[city] + np.random.uniform(-0.08, 0.08)
    lon = lon_base[city] + np.random.uniform(-0.08, 0.08)
    
    weight_kg = int(np.random.normal(70 if gender=='Male' else 58, 10))
    weight_kg = max(45, min(110, weight_kg))
    
    has_chronic = random.choices([0, 1], [0.88, 0.12])[0]
    
    # AVAILABILITY LABEL — the target variable for Logistic Regression
    # Based on: recent donation (>56 days ago), available, no chronic illness, age in range
    prob_available = 0.5
    if last_days >= 56:  prob_available += 0.25
    if last_days >= 90:  prob_available += 0.10
    if has_chronic:      prob_available -= 0.35
    if donations >= 3:   prob_available += 0.10
    if 25 <= age <= 50:  prob_available += 0.08
    if weight_kg < 50:   prob_available -= 0.20
    prob_available = max(0.05, min(0.95, prob_available))
    is_available = int(np.random.rand() < prob_available)
    
    recency_weeks = round(last_days / 7, 1)
    
    records.append({
        'donor_id':          f'DNR-{1000+i}',
        'name':              f'Donor_{i+1}',
        'age':               age,
        'gender':            gender,
        'blood_group':       bg,
        'city':              city,
        'area':              area,
        'latitude':          round(lat, 6),
        'longitude':         round(lon, 6),
        'donations_count':   donations,
        'streak_count':      streak,
        'last_donation_date':last_donation,
        'recency_weeks':     recency_weeks,
        'weight_kg':         weight_kg,
        'has_chronic_illness':has_chronic,
        'is_available':      is_available     # TARGET
    })

donors_df = pd.DataFrame(records)
donors_df.to_csv('/tmp/bloodlink_donors.csv', index=False)
print(f"[donors]  {len(donors_df)} rows, {donors_df['is_available'].mean()*100:.1f}% available")

# ─── GENERATE EMERGENCY REQUESTS DATASET ──────────────────────────────────────
urgency_templates = {
    'low':      ["Patient scheduled for elective surgery next week needs {bg} blood.",
                 "Routine pre-op prep requires {bg} units by Friday.",
                 "Minor procedure planned, looking for {bg} donors.",
                 "Thalassemia follow-up, requires {bg} transfusion in 3 days.",
                 "Outpatient anemia treatment needs {bg} donors."],
    'medium':   ["Patient admitted with {bg} blood shortage, transfusion needed today.",
                 "Surgery in 12 hours needs 2 units of {bg} blood.",
                 "Dengue fever patient needs {bg} platelets urgently.",
                 "Cancer patient undergoing chemo needs {bg} blood ASAP.",
                 "Liver disease patient requires {bg} transfusion within hours."],
    'urgent':   ["URGENT: Accident victim at PIMS needs {bg} blood immediately!",
                 "Emergency! RTA patient needs {bg} — 3 units NOW.",
                 "Gunshot wound patient in ICU. Needs {bg} emergency transfusion!",
                 "PPH patient hemorrhaging — {bg} blood CRITICAL EMERGENCY.",
                 "Multi-organ failure: {bg} needed IN THE NEXT HOUR."],
    'critical': ["CRITICAL LIFE OR DEATH: Patient on ventilator needs {bg} THIS MINUTE.",
                 "CODE RED at Holy Family — {bg} O- NEEDED NOW OR PATIENT DIES.",
                 "ICU patient BP crashing, massive transfusion needed: {bg}. CALL NOW.",
                 "Post-cardiac surgery critical bleed — {bg} blood — SEND DONOR IMMEDIATELY.",
                 "MAYDAY MAYDAY — PICU child bleeding, needs {bg} now. Time = life."]
}

req_records = []
for i in range(800):
    urgency = random.choices(['low','medium','urgent','critical'], [0.25, 0.35, 0.28, 0.12])[0]
    bg      = random.choices(blood_groups, bg_weights)[0]
    city    = random.choices(cities, city_weights)[0]
    tmpl    = random.choice(urgency_templates[urgency])
    text    = tmpl.format(bg=bg)
    
    units_needed = {'low':1, 'medium':2, 'urgent':3, 'critical':5}[urgency] + random.randint(0,2)
    response_hrs = {'low': np.random.uniform(24,72), 'medium': np.random.uniform(6,24),
                    'urgent': np.random.uniform(1,6),  'critical': np.random.uniform(0.1,1)}[urgency]
    
    req_records.append({
        'request_id':     f'REQ-{2000+i}',
        'request_text':   text,
        'blood_group':    bg,
        'city':           city,
        'units_needed':   units_needed,
        'response_hours': round(response_hrs, 2),
        'urgency_label':  urgency    # TARGET
    })

req_df = pd.DataFrame(req_records)
req_df.to_csv('/tmp/bloodlink_emergency_requests.csv', index=False)
print(f"[requests] {len(req_df)} rows | class dist: {req_df['urgency_label'].value_counts().to_dict()}")

# ─── GENERATE BLOOD DEMAND TIME SERIES ────────────────────────────────────────
ts_records = []
start_date = datetime(2024, 1, 1)
for bg in blood_groups:
    base_demand = {'O+': 38, 'A+': 28, 'B+': 22, 'O-': 8, 'A-': 5, 'B-': 4, 'AB+': 4, 'AB-': 2}[bg]
    for d in range(540):  # 18 months of data
        date = start_date + timedelta(days=d)
        # Weekly seasonality: weekends lower
        dow_factor = 0.75 if date.weekday() >= 5 else 1.0
        # Monthly trend: Ramadan bump (March-April approx), winter bump
        month_factor = 1.2 if date.month in [3, 4] else (1.1 if date.month in [12, 1] else 1.0)
        noise = np.random.normal(0, base_demand * 0.18)
        demand = max(0, int(base_demand * dow_factor * month_factor + noise))
        
        ts_records.append({
            'date':       date.strftime('%Y-%m-%d'),
            'blood_group': bg,
            'units_requested': demand,
            'day_of_week':    date.weekday(),   # 0=Mon, 6=Sun
            'month':          date.month,
            'is_weekend':     int(date.weekday() >= 5)
        })

ts_df = pd.DataFrame(ts_records)
ts_df.to_csv('/tmp/bloodlink_demand_timeseries.csv', index=False)
print(f"[timeseries] {len(ts_df)} rows | {ts_df['blood_group'].nunique()} blood groups × 540 days")

print("\n✅ All 3 datasets generated successfully.")
print(f"   donors:    /tmp/bloodlink_donors.csv           ({len(donors_df)} rows)")
print(f"   requests:  /tmp/bloodlink_emergency_requests.csv ({len(req_df)} rows)")
print(f"   timeseries:/tmp/bloodlink_demand_timeseries.csv  ({len(ts_df)} rows)")
