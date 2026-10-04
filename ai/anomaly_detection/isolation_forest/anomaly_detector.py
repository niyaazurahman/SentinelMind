"""
SentinelMind Isolation Forest Anomaly Detection Engine.

Detects multi-variate physiological and operational anomalies:
- Sleep Drop: Acute reduction in sleep duration or severe sleep debt
- HRV Collapse: Sudden parasympathetic vagal crash (< 25ms or > 35% below baseline)
- Mood Crash: Sudden plunge in psychological morale (<= 2 or drop >= 4 points)
- Extreme Duty Hours: Operational fatigue and shift overload (>= 13.5 hours)
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

ANOMALY_FEATURES = [
    "Sleep_Hours",
    "HRV",
    "Mood_Score",
    "Duty_Hours",
]

# Signature thresholds for anomaly taxonomy attribution
ANOMALY_THRESHOLDS = {
    "SLEEP_DROP": {
        "critical_absolute_hours": 3.8,
        "warning_absolute_hours": 4.5,
        "description": "Acute sleep deprivation preventing physiological restoration",
    },
    "HRV_COLLAPSE": {
        "critical_absolute_rmssd": 22.0,
        "warning_absolute_rmssd": 28.0,
        "description": "Severe parasympathetic suppression and autonomic exhaustion",
    },
    "MOOD_CRASH": {
        "critical_score": 2,
        "warning_score": 3,
        "description": "Acute psychological distress or morale breakdown",
    },
    "EXTREME_DUTY_HOURS": {
        "critical_hours": 14.5,
        "warning_hours": 12.5,
        "description": "Operational over-extension exceeding safe cognitive duty limits",
    },
}


class SentinelMindAnomalyDetector:
    """
    Unsupervised Anomaly Detection Service using Isolation Forest.
    Isolates multi-variate physiological and workload deviations and
    attaches clinical explainability for specific breakdown signatures.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        contamination: float = 0.05,
        random_state: int = 42,
    ):
        if model_path is None:
            model_path = "ai/models_registry/artifacts/sentinelmind_isolation_forest.joblib"

        self.model_path = Path(model_path)
        self.contamination = contamination
        self.random_state = random_state
        self.model: Optional[IsolationForest] = None

        if self.model_path.exists():
            self.load_model()
        else:
            self._init_untrained_model()

    def _init_untrained_model(self):
        """Initializes default Isolation Forest estimator."""
        self.model = IsolationForest(
            n_estimators=200,
            max_samples="auto",
            contamination=self.contamination,  # Expect ~5% genuine critical anomalies in armed forces
            max_features=1.0,
            bootstrap=False,
            random_state=self.random_state,
            n_jobs=-1,
        )

    def fit(self, df: pd.DataFrame) -> "SentinelMindAnomalyDetector":
        """
        Fits Isolation Forest on multi-variate feature distribution:
        Sleep Hours, HRV, Mood Score, and Duty Hours.
        """
        print(f"[AnomalyDetector] Training Isolation Forest on {len(df):,} records...")

        # Validate features
        for f in ANOMALY_FEATURES:
            if f not in df.columns:
                raise ValueError(f"Missing required feature: '{f}'")

        X = df[ANOMALY_FEATURES].copy()

        self._init_untrained_model()
        self.model.fit(X)

        # Compute training stats for baseline calibration
        inliers = self.model.predict(X) == 1
        scores = self.model.decision_function(X)

        print(f"[AnomalyDetector] Training complete:")
        print(f"  * Total Samples:    {len(X):,}")
        print(f"  * Inliers:          {np.sum(inliers):,} ({np.mean(inliers)*100:.1f}%)")
        print(f"  * Anomalies:        {np.sum(~inliers):,} ({np.mean(~inliers)*100:.1f}%)")
        print(f"  * Mean Score:       {np.mean(scores):.4f}")

        return self

    def save_model(self, export_path: Optional[str] = None):
        """Serializes trained Isolation Forest model to disk."""
        target_path = Path(export_path) if export_path else self.model_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, str(target_path))
        print(f"[AnomalyDetector] Serialized model to '{target_path}'.")

    def load_model(self):
        """Loads fitted model from disk."""
        self.model = joblib.load(str(self.model_path))

    def evaluate_signatures(
        self,
        sleep_hours: float,
        hrv: float,
        mood_score: int,
        duty_hours: float,
        baseline_hrv: Optional[float] = None,
        baseline_sleep: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Analyzes individual dimensions to identify specific anomaly triggers:
        Sleep Drop, HRV Collapse, Mood Crash, Extreme Duty Hours.
        """
        signatures = []

        # 1. Sleep Drop Check
        sleep_crit = ANOMALY_THRESHOLDS["SLEEP_DROP"]["critical_absolute_hours"]
        sleep_warn = ANOMALY_THRESHOLDS["SLEEP_DROP"]["warning_absolute_hours"]
        if sleep_hours <= sleep_crit:
            signatures.append({
                "type": "SLEEP_DROP",
                "severity": "CRITICAL",
                "trigger_value": f"{sleep_hours:.1f} hrs",
                "threshold": f"<= {sleep_crit} hrs",
                "message": f"Critical sleep deprivation: {sleep_hours:.1f} hours of sleep recorded.",
            })
        elif sleep_hours <= sleep_warn:
            signatures.append({
                "type": "SLEEP_DROP",
                "severity": "WARNING",
                "trigger_value": f"{sleep_hours:.1f} hrs",
                "threshold": f"<= {sleep_warn} hrs",
                "message": f"Elevated sleep deficit: {sleep_hours:.1f} hours of sleep recorded.",
            })
        elif baseline_sleep and (baseline_sleep - sleep_hours) >= 3.0:
            signatures.append({
                "type": "SLEEP_DROP",
                "severity": "WARNING",
                "trigger_value": f"-{baseline_sleep - sleep_hours:.1f} hrs vs baseline",
                "threshold": ">= 3.0 hrs drop",
                "message": f"Acute sleep drop of {baseline_sleep - sleep_hours:.1f} hrs from individual baseline.",
            })

        # 2. HRV Collapse Check
        hrv_crit = ANOMALY_THRESHOLDS["HRV_COLLAPSE"]["critical_absolute_rmssd"]
        hrv_warn = ANOMALY_THRESHOLDS["HRV_COLLAPSE"]["warning_absolute_rmssd"]
        if hrv <= hrv_crit:
            signatures.append({
                "type": "HRV_COLLAPSE",
                "severity": "CRITICAL",
                "trigger_value": f"{hrv:.1f} ms",
                "threshold": f"<= {hrv_crit} ms",
                "message": f"Acute vagal withdrawal: HRV collapsed to {hrv:.1f} ms.",
            })
        elif hrv <= hrv_warn:
            signatures.append({
                "type": "HRV_COLLAPSE",
                "severity": "WARNING",
                "trigger_value": f"{hrv:.1f} ms",
                "threshold": f"<= {hrv_warn} ms",
                "message": f"Depressed parasympathetic recovery: HRV at {hrv:.1f} ms.",
            })
        elif baseline_hrv and baseline_hrv > 0 and ((baseline_hrv - hrv) / baseline_hrv) >= 0.35:
            drop_pct = ((baseline_hrv - hrv) / baseline_hrv) * 100.0
            signatures.append({
                "type": "HRV_COLLAPSE",
                "severity": "CRITICAL",
                "trigger_value": f"-{drop_pct:.1f}% vs baseline",
                "threshold": ">= 35% drop",
                "message": f"Autonomic crash: HRV dropped {drop_pct:.1f}% below normative baseline.",
            })

        # 3. Mood Crash Check
        mood_crit = ANOMALY_THRESHOLDS["MOOD_CRASH"]["critical_score"]
        mood_warn = ANOMALY_THRESHOLDS["MOOD_CRASH"]["warning_score"]
        if mood_score <= mood_crit:
            signatures.append({
                "type": "MOOD_CRASH",
                "severity": "CRITICAL",
                "trigger_value": f"Rating {mood_score}/10",
                "threshold": f"<= {mood_crit}/10",
                "message": f"Critical psychological distress: self-reported mood rating {mood_score}/10.",
            })
        elif mood_score <= mood_warn:
            signatures.append({
                "type": "MOOD_CRASH",
                "severity": "WARNING",
                "trigger_value": f"Rating {mood_score}/10",
                "threshold": f"<= {mood_warn}/10",
                "message": f"Low morale warning: self-reported mood rating {mood_score}/10.",
            })

        # 4. Extreme Duty Hours Check
        duty_crit = ANOMALY_THRESHOLDS["EXTREME_DUTY_HOURS"]["critical_hours"]
        duty_warn = ANOMALY_THRESHOLDS["EXTREME_DUTY_HOURS"]["warning_hours"]
        if duty_hours >= duty_crit:
            signatures.append({
                "type": "EXTREME_DUTY_HOURS",
                "severity": "CRITICAL",
                "trigger_value": f"{duty_hours:.1f} hrs",
                "threshold": f">= {duty_crit} hrs",
                "message": f"Dangerous shift duration: {duty_hours:.1f} consecutive operational hours.",
            })
        elif duty_hours >= duty_warn:
            signatures.append({
                "type": "EXTREME_DUTY_HOURS",
                "severity": "WARNING",
                "trigger_value": f"{duty_hours:.1f} hrs",
                "threshold": f">= {duty_warn} hrs",
                "message": f"Extended operational duty: {duty_hours:.1f} continuous hours logged.",
            })

        return signatures

    def detect(
        self,
        sleep_hours: float,
        hrv: float,
        mood_score: int,
        duty_hours: float,
        baseline_hrv: Optional[float] = None,
        baseline_sleep: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Detects anomalies via Isolation Forest and maps them to clinical breakdown signatures.
        """
        input_df = pd.DataFrame([{
            "Sleep_Hours": float(sleep_hours),
            "HRV": float(hrv),
            "Mood_Score": int(mood_score),
            "Duty_Hours": float(duty_hours),
        }])

        # Isolation Forest Decision Function:
        # Negative scores indicate anomalous deviations; positive indicate normal cluster.
        raw_score = float(self.model.decision_function(input_df)[0])
        pred_label = int(self.model.predict(input_df)[0])  # -1 for anomaly, 1 for inlier

        # Clinical rule-based signature check
        signatures = self.evaluate_signatures(
            sleep_hours=sleep_hours,
            hrv=hrv,
            mood_score=mood_score,
            duty_hours=duty_hours,
            baseline_hrv=baseline_hrv,
            baseline_sleep=baseline_sleep,
        )

        # Flagged as anomaly if Isolation Forest flags -1 OR any CRITICAL signature is detected
        has_critical = any(s["severity"] == "CRITICAL" for s in signatures)
        is_anomaly = (pred_label == -1) or has_critical

        # Normalized anomaly severity rating (0.0 to 1.0)
        # Decision function typically ranges [-0.5, 0.5]
        normalized_anomaly_index = max(0.0, min(1.0, 0.5 - raw_score))

        # Overall severity classification
        if has_critical or normalized_anomaly_index >= 0.70:
            severity = "CRITICAL"
        elif len(signatures) > 0 or normalized_anomaly_index >= 0.50:
            severity = "HIGH"
        elif is_anomaly:
            severity = "MODERATE"
        else:
            severity = "NORMAL"

        # Actionable clinical recommendation
        recommendation = self._generate_recommendation(signatures, is_anomaly)

        return {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": round(raw_score, 4),
            "normalized_anomaly_index": round(normalized_anomaly_index, 4),
            "severity": severity,
            "detected_signatures": [s["type"] for s in signatures],
            "signature_details": signatures,
            "clinical_recommendation": recommendation,
        }

    def _generate_recommendation(
        self,
        signatures: List[Dict[str, Any]],
        is_anomaly: bool,
    ) -> str:
        if not is_anomaly and not signatures:
            return "Vitals and operational load are within normal physiological variance."

        types = [s["type"] for s in signatures]
        actions = []
        if "SLEEP_DROP" in types:
            actions.append("Mandatory 6-8h sleep recovery block ordered")
        if "HRV_COLLAPSE" in types:
            actions.append("Autonomous nervous system strain: schedule 24h vitals monitoring")
        if "MOOD_CRASH" in types:
            actions.append("Clinical welfare check-in recommended with unit medical officer")
        if "EXTREME_DUTY_HOURS" in types:
            actions.append("Mandatory operational stand-down and duty rotation")

        if not actions and is_anomaly:
            actions.append("Unclassified multi-variate biometric divergence: review by Medical Officer")

        return "; ".join(actions) + "."


# Standalone self-training CLI execution
if __name__ == "__main__":
    dataset_csv = "ai/training/datasets/sentinelmind_synthetic_dataset.csv"
    if not os.path.exists(dataset_csv):
        from ai.training.datasets.generate_dataset import generate_sentinelmind_csv
        generate_sentinelmind_csv(10000, output_path=dataset_csv)

    df_train = pd.read_csv(dataset_csv)
    detector = SentinelMindAnomalyDetector()
    detector.fit(df_train)
    detector.save_model()

    # Test Anomaly Case 1: HRV Collapse & Sleep Drop
    print("\n[Test 1] Testing acute HRV Collapse & Sleep Drop...")
    res1 = detector.detect(sleep_hours=3.2, hrv=18.5, mood_score=5, duty_hours=10.0)
    print(json.dumps(res1, indent=2))

    # Test Anomaly Case 2: Extreme Duty Hours & Mood Crash
    print("\n[Test 2] Testing Extreme Duty Hours & Mood Crash...")
    res2 = detector.detect(sleep_hours=5.0, hrv=45.0, mood_score=2, duty_hours=16.0)
    print(json.dumps(res2, indent=2))
