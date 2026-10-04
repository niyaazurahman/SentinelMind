"""
SentinelMind Production Predictor Service.
Loads trained XGBoost model and provides low-latency inference,
outputting both continuous Risk Score and discrete Risk Category.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd
import xgboost as xgb

FEATURE_NAMES = [
    "Sleep_Hours",
    "HRV",
    "Resting_HR",
    "Duty_Hours",
    "Mood_Score",
    "Deployment_Intensity",
    "Incident_Exposure",
]


def classify_risk_tier(score: float) -> str:
    """Classifies continuous stress risk score (0-100) into NATO-aligned operational tiers."""
    if score < 35.0:
        return "LOW"
    elif score < 65.0:
        return "MODERATE"
    elif score < 85.0:
        return "HIGH"
    return "SEVERE"


class SentinelMindPredictor:
    """
    Lightweight, production-ready inference wrapper.
    Accepts single reading dictionaries, lists of dictionaries, or DataFrames.
    Outputs:
      - risk_score: float (0.00 - 100.00)
      - risk_category: str ('LOW', 'MODERATE', 'HIGH', 'SEVERE')
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = "ai/models_registry/artifacts/sentinelmind_xgboost_model.json"

        self.model_path = Path(model_path)
        self.model = xgb.XGBRegressor()

        if self.model_path.exists():
            self.model.load_model(str(self.model_path))
        else:
            # Fallback to joblib if available
            import joblib
            joblib_path = self.model_path.with_suffix(".joblib")
            if joblib_path.exists():
                self.model = joblib.load(str(joblib_path))
            else:
                raise FileNotFoundError(
                    f"Model artifact not found at {self.model_path}. "
                    "Run 'ai/training/pipelines/train_xgboost.py' first."
                )

    def predict_one(
        self,
        sleep_hours: float,
        hrv: float,
        resting_hr: int,
        duty_hours: float,
        mood_score: int,
        deployment_intensity: int,
        incident_exposure: int,
    ) -> Dict[str, Any]:
        """Convenience method for individual real-time inference."""
        data = {
            "Sleep_Hours": float(sleep_hours),
            "HRV": float(hrv),
            "Resting_HR": int(resting_hr),
            "Duty_Hours": float(duty_hours),
            "Mood_Score": int(mood_score),
            "Deployment_Intensity": int(deployment_intensity),
            "Incident_Exposure": int(incident_exposure),
        }
        return self.predict(data)

    def predict(
        self,
        features: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame],
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Executes prediction on a single record or a batch.
        """
        is_single = isinstance(features, dict)
        if is_single:
            df = pd.DataFrame([features])
        elif isinstance(features, list):
            df = pd.DataFrame(features)
        else:
            df = features.copy()

        # Validate input features
        for f in FEATURE_NAMES:
            if f not in df.columns:
                raise ValueError(f"Missing required feature: '{f}'")

        X = df[FEATURE_NAMES]
        preds = self.model.predict(X)
        clipped = np.clip(preds, 0.0, 100.0)

        results = []
        for p in clipped:
            val = round(float(p), 2)
            results.append({
                "risk_score": val,
                "risk_category": classify_risk_tier(val),
            })

        return results[0] if is_single else results
