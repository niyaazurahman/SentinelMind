"""
SentinelMind Synthetic Dataset Generator.
Generates 10,000 physiologically and operationally realistic personnel records
for training XGBoost stress prediction and Isolation Forest anomaly models.

Features:
- Sleep Hours (hours)
- HRV (RMSSD in ms)
- Resting HR (BPM)
- Duty Hours (hours)
- Mood Score (1-10)
- Deployment Intensity (1-5)
- Incident Exposure (0-5 count)

Target:
- Stress Risk Score (0.00 - 100.00)

Pure Python implementation using standard libraries (csv, math, random),
with zero external dependencies required.
"""

import csv
import math
import os
import random


def generate_sentinelmind_csv(
    num_records: int = 10000,
    random_seed: int = 42,
    output_path: str = "sentinelmind_synthetic_dataset.csv",
):
    random.seed(random_seed)
    print(f"[SentinelMind] Synthesizing {num_records:,} operational records...")

    headers = [
        "Sleep_Hours",
        "HRV",
        "Resting_HR",
        "Duty_Hours",
        "Mood_Score",
        "Deployment_Intensity",
        "Incident_Exposure",
        "Stress_Risk_Score",
    ]

    # Pre-calculated deployment distribution probabilities
    # 1: Routine Base (30%), 2: Field Training (25%), 3: High-Tempo Ops (22%), 4: Border/Recon (15%), 5: Combat (8%)
    deployment_choices = [1] * 30 + [2] * 25 + [3] * 22 + [4] * 15 + [5] * 8

    records = []

    # Distribution counters
    risk_low = 0
    risk_mod = 0
    risk_high = 0
    risk_severe = 0

    for _ in range(num_records):
        # 1. Operational Context
        intensity = random.choice(deployment_choices)

        # Incident Exposure (Poisson-like skew based on deployment intensity)
        lam = 0.16 * intensity
        # Knuth's Poisson generator
        L = math.exp(-lam)
        k = 0
        p = 1.0
        while p > L:
            k += 1
            p *= random.random()
        incident_exposure = min(5, max(0, k - 1))

        # Duty Hours: baseline ~8-9h, scaled by deployment intensity
        mean_duty = 8.0 + (intensity - 1) * 1.75
        duty_hours = max(4.0, min(18.0, random.gauss(mean_duty, 1.4)))

        # 2. Physiological Responses
        # Sleep Hours: heavily suppressed by duty hours, deployment intensity, and incident exposure
        max_possible_sleep = max(3.0, 24.0 - duty_hours - 5.5)
        mean_sleep = min(7.8, max_possible_sleep) - (incident_exposure * 0.35)
        sleep_hours = max(2.5, min(9.5, random.gauss(mean_sleep, 1.05)))

        # Heart Rate Variability (RMSSD in ms): Parasympathetic marker
        # Depressed by sleep loss, long shifts, and combat exposure
        base_hrv = random.gauss(58.0, 10.0)
        sleep_effect = (sleep_hours - 7.5) * 4.2
        duty_penalty = max(0.0, duty_hours - 9.0) * 1.75
        incident_penalty = incident_exposure * 6.2
        intensity_penalty = (intensity - 1) * 2.4
        calc_hrv = base_hrv + sleep_effect - duty_penalty - incident_penalty - intensity_penalty + random.gauss(0, 3.0)
        hrv = max(12.0, min(120.0, calc_hrv))

        # Resting Heart Rate (BPM): Increases with sympathetic tone and fatigue
        base_rhr = 60.0 + (65.0 - hrv) * 0.22
        sleep_debt_effect = max(0.0, 7.0 - sleep_hours) * 1.75
        arousal = incident_exposure * 2.2 + (intensity - 1) * 1.4
        calc_rhr = base_rhr + sleep_debt_effect + arousal + random.gauss(0, 2.5)
        resting_hr = max(46, min(112, round(calc_rhr)))

        # 3. Psychological State (Mood Score: 1 - 10)
        base_mood = 7.2
        sleep_mod = (sleep_hours - 7.0) * 0.55
        duty_mod = -max(0.0, duty_hours - 8.5) * 0.32
        incident_mod = -incident_exposure * 0.90
        intensity_mod = -(intensity - 1) * 0.28
        calc_mood = base_mood + sleep_mod + duty_mod + incident_mod + intensity_mod + random.gauss(0, 0.75)
        mood_score = max(1, min(10, round(calc_mood)))

        # 4. Target Variable: Stress Risk Score (0.00 to 100.00)
        # Component 1: Autonomic Strain (HRV & Resting HR) - 30% weight
        hrv_norm = max(0.0, min(1.0, (65.0 - hrv) / 50.0))
        rhr_norm = max(0.0, min(1.0, (resting_hr - 55.0) / 45.0))
        autonomic_component = (hrv_norm * 0.65 + rhr_norm * 0.35) * 30.0

        # Component 2: Sleep & Recovery Deficit - 25% weight
        sleep_deficit_norm = max(0.0, min(1.0, (7.5 - sleep_hours) / 4.5))
        sleep_component = sleep_deficit_norm * 25.0

        # Component 3: Workload & Deployment Strain - 20% weight
        duty_norm = max(0.0, min(1.0, (duty_hours - 7.0) / 10.0))
        intensity_norm = (intensity - 1.0) / 4.0
        workload_component = (duty_norm * 0.60 + intensity_norm * 0.40) * 20.0

        # Component 4: Psychological & Trauma Exposure - 20% weight
        mood_deficit_norm = (10.0 - mood_score) / 9.0
        incident_norm = max(0.0, min(1.0, incident_exposure / 4.0))
        psych_component = (mood_deficit_norm * 0.55 + incident_norm * 0.45) * 20.0

        # Component 5: Compound Risk Multiplier (Synergy: High Duty + Low Sleep) - 5% weight
        synergy = (duty_norm * sleep_deficit_norm) * 5.0

        # Observational noise
        noise = random.gauss(0, 1.8)
        raw_score = (
            autonomic_component
            + sleep_component
            + workload_component
            + psych_component
            + synergy
            + noise
        )
        stress_risk_score = round(max(0.0, min(100.0, raw_score)), 2)

        # Track tier distribution
        if stress_risk_score < 35.0:
            risk_low += 1
        elif stress_risk_score < 65.0:
            risk_mod += 1
        elif stress_risk_score < 85.0:
            risk_high += 1
        else:
            risk_severe += 1

        records.append(
            [
                round(sleep_hours, 2),
                round(hrv, 2),
                resting_hr,
                round(duty_hours, 2),
                mood_score,
                intensity,
                incident_exposure,
                stress_risk_score,
            ]
        )

    # Write to CSV
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(records)

    print(f"[SentinelMind] Successfully saved {len(records):,} records to '{output_path}'.")
    print("\n" + "=" * 65)
    print("SENTINELMIND DATASET SUMMARY (10,000 RECORDS)")
    print("=" * 65)
    print(f"File Output: {output_path}")
    print(f"Total Rows:  {len(records):,}")
    print("\nStress Risk Distribution:")
    print(f"  - Low (0.0 - 34.9):       {risk_low:,} ({risk_low / num_records * 100:.1f}%)")
    print(f"  - Moderate (35.0 - 64.9): {risk_mod:,} ({risk_mod / num_records * 100:.1f}%)")
    print(f"  - High (65.0 - 84.9):     {risk_high:,} ({risk_high / num_records * 100:.1f}%)")
    print(f"  - Severe (85.0 - 100.0):  {risk_severe:,} ({risk_severe / num_records * 100:.1f}%)")
    print("=" * 65)


if __name__ == "__main__":
    generate_sentinelmind_csv(
        num_records=10000,
        random_seed=42,
        output_path="ai/training/datasets/sentinelmind_synthetic_dataset.csv",
    )
