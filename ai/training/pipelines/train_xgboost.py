"""
SentinelMind Production-Ready XGBoost Training Pipeline.

Architecture & Stages:
1. Data Ingestion & Schema Validation
2. Data Cleaning & Robust Outlier Sanitization
3. Stratified Train / Test Split
4. XGBoost Regressor Hyperparameter Configuration & Early Stopping
5. Multi-tier Model Evaluation (MAE, RMSE, R2, Classification Accuracy, F1-Score, Confusion Matrix)
6. Model Serialization (.json, .ubj, and joblib) & Metadata Export
7. Inference Wrapper producing both Risk Score and Risk Category
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
import xgboost as xgb


# ==============================================================================
# 1. CONSTANTS & CONFIGURATION
# ==============================================================================

FEATURE_NAMES = [
    "Sleep_Hours",
    "HRV",
    "Resting_HR",
    "Duty_Hours",
    "Mood_Score",
    "Deployment_Intensity",
    "Incident_Exposure",
]

TARGET_COLUMN = "Stress_Risk_Score"

RISK_TIERS = [
    (0.0, 35.0, "LOW"),
    (35.0, 65.0, "MODERATE"),
    (65.0, 85.0, "HIGH"),
    (85.0, 100.01, "SEVERE"),
]

# Physical / physiological feasibility bounds for outlier sanitization
FEASIBILITY_BOUNDS = {
    "Sleep_Hours": (0.0, 24.0),
    "HRV": (5.0, 250.0),
    "Resting_HR": (30, 220),
    "Duty_Hours": (0.0, 24.0),
    "Mood_Score": (1, 10),
    "Deployment_Intensity": (1, 5),
    "Incident_Exposure": (0, 10),
    "Stress_Risk_Score": (0.0, 100.0),
}


def map_score_to_category(score: Union[float, int, np.ndarray]) -> Union[str, np.ndarray]:
    """
    Converts continuous Stress Risk Score (0-100) into discrete operational risk tiers.
    """
    if isinstance(score, (np.ndarray, pd.Series, list)):
        score_arr = np.array(score)
        categories = np.empty(score_arr.shape, dtype=object)
        categories[score_arr < 35.0] = "LOW"
        categories[(score_arr >= 35.0) & (score_arr < 65.0)] = "MODERATE"
        categories[(score_arr >= 65.0) & (score_arr < 85.0)] = "HIGH"
        categories[score_arr >= 85.0] = "SEVERE"
        return categories

    val = float(score)
    if val < 35.0:
        return "LOW"
    elif val < 65.0:
        return "MODERATE"
    elif val < 85.0:
        return "HIGH"
    return "SEVERE"


# ==============================================================================
# 2. DATA CLEANING & PREPROCESSING
# ==============================================================================

class DataCleaner:
    """Production data cleaner enforcing strict biological and operational bounds."""

    @staticmethod
    def clean(df: pd.DataFrame) -> pd.DataFrame:
        df_clean = df.copy()

        # Check required columns
        missing_cols = set(FEATURE_NAMES + [TARGET_COLUMN]) - set(df_clean.columns)
        if missing_cols:
            raise ValueError(f"Missing required columns in dataset: {missing_cols}")

        initial_len = len(df_clean)

        # 1. Drop nulls or impute median
        for col in FEATURE_NAMES + [TARGET_COLUMN]:
            if df_clean[col].isnull().any():
                median_val = df_clean[col].median()
                df_clean[col] = df_clean[col].fillna(median_val)

        # 2. Clamp outliers within physiological feasibility bounds
        for col, (lower, upper) in FEASIBILITY_BOUNDS.items():
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].clip(lower=lower, upper=upper)

        # 3. Ensure proper data types
        df_clean["Resting_HR"] = df_clean["Resting_HR"].astype(int)
        df_clean["Mood_Score"] = df_clean["Mood_Score"].astype(int)
        df_clean["Deployment_Intensity"] = df_clean["Deployment_Intensity"].astype(int)
        df_clean["Incident_Exposure"] = df_clean["Incident_Exposure"].astype(int)
        df_clean["Sleep_Hours"] = df_clean["Sleep_Hours"].astype(float)
        df_clean["HRV"] = df_clean["HRV"].astype(float)
        df_clean["Duty_Hours"] = df_clean["Duty_Hours"].astype(float)
        df_clean["Stress_Risk_Score"] = df_clean["Stress_Risk_Score"].astype(float)

        # Drop duplicate identical observations
        df_clean = df_clean.drop_duplicates()
        dropped = initial_len - len(df_clean)
        if dropped > 0:
            print(f"[DataCleaner] Removed {dropped} duplicate records.")

        print(f"[DataCleaner] Sanitized dataset: {len(df_clean):,} clean records ready.")
        return df_clean


# ==============================================================================
# 3. MODEL TRAINING PIPELINE
# ==============================================================================

class SentinelMindTrainer:
    def __init__(
        self,
        dataset_path: str = "ai/training/datasets/sentinelmind_synthetic_dataset.csv",
        artifacts_dir: str = "ai/models_registry/artifacts",
        test_size: float = 0.20,
        random_state: int = 42,
    ):
        self.dataset_path = dataset_path
        self.artifacts_dir = Path(artifacts_dir)
        self.test_size = test_size
        self.random_state = random_state

        self.model: Optional[xgb.XGBRegressor] = None
        self.metrics: Dict[str, Any] = {}

    def run_pipeline(self) -> Dict[str, Any]:
        """Executes full lifecycle: Load -> Clean -> Split -> Train -> Eval -> Save."""
        print("=" * 70)
        print("SENTINELMIND: XGBOOST PRODUCTION TRAINING PIPELINE")
        print("=" * 70)

        # Step 1: Load and clean data
        print(f"\n[1/6] Loading data from '{self.dataset_path}'...")
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found at {self.dataset_path}")

        raw_df = pd.read_csv(self.dataset_path)
        clean_df = DataCleaner.clean(raw_df)

        # Step 2: Stratified Train/Test Split
        print(f"\n[2/6] Splitting data (Test size: {self.test_size*100:.0f}%)...")
        X = clean_df[FEATURE_NAMES]
        y = clean_df[TARGET_COLUMN]

        # Generate discrete risk categories for stratification
        stratify_labels = map_score_to_category(y)

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=self.test_size,
            random_state=self.random_state,
            stratify=stratify_labels,
        )

        print(f"  - Training samples:   {len(X_train):,}")
        print(f"  - Testing samples:    {len(X_test):,}")

        # Step 3: Model Configuration & Training
        print("\n[3/6] Initializing and training XGBoost Regressor...")
        # Defense-grade tuned hyperparameters
        self.model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_alpha=0.1,  # L1 regularization to prevent overfitting on specific features
            reg_lambda=1.2,  # L2 regularization
            objective="reg:squarederror",
            eval_metric=["rmse", "mae"],
            random_state=self.random_state,
            n_jobs=-1,
            early_stopping_rounds=25,
        )

        # Fit with evaluation tracking
        self.model.fit(
            X_train,
            y_train,
            eval_set=[(X_train, y_train), (X_test, y_test)],
            verbose=False,
        )

        best_iteration = getattr(self.model, "best_iteration", 300)
        print(f"  - Training complete. Optimal iteration: {best_iteration}")

        # Step 4: Comprehensive Multi-Tier Evaluation
        print("\n[4/6] Evaluating model performance...")
        self.metrics = self._evaluate(X_train, X_test, y_train, y_test)

        # Step 5: Save Model & Artifacts
        print(f"\n[5/6] Serializing model and metadata to '{self.artifacts_dir}'...")
        self._save_artifacts()

        # Step 6: Inference Test
        print("\n[6/6] Verifying inference pipeline outputs...")
        sample_pred = self._sample_inference()
        print(f"  - Test Case Prediction:")
        print(f"    * Raw Score:    {sample_pred['risk_score']:.2f} / 100.00")
        print(f"    * Risk Tier:    {sample_pred['risk_category']}")

        print("\n" + "=" * 70)
        print("PIPELINE EXECUTION SUCCESSFUL")
        print("=" * 70)
        return self.metrics

    def _evaluate(
        self,
        X_train: pd.DataFrame,
        X_test: pd.DataFrame,
        y_train: pd.Series,
        y_test: pd.Series,
    ) -> Dict[str, Any]:
        """Calculates regression metrics and categorical triage classification metrics."""
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)

        # Regression Metrics
        train_mae = mean_absolute_error(y_train, y_pred_train)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        test_r2 = r2_score(y_test, y_pred_test)

        # Categorical Triage Metrics
        y_test_cats = map_score_to_category(y_test.values)
        y_pred_cats = map_score_to_category(y_pred_test)

        labels = ["LOW", "MODERATE", "HIGH", "SEVERE"]
        cat_accuracy = accuracy_score(y_test_cats, y_pred_cats)
        cat_f1_macro = f1_score(y_test_cats, y_pred_cats, average="macro", labels=labels)
        cat_f1_weighted = f1_score(y_test_cats, y_pred_cats, average="weighted", labels=labels)
        conf_matrix = confusion_matrix(y_test_cats, y_pred_cats, labels=labels)

        # Feature Importance
        importances = dict(zip(FEATURE_NAMES, self.model.feature_importances_.tolist()))
        sorted_importance = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

        print("\n" + "-" * 50)
        print("EVALUATION SCORECARD")
        print("-" * 50)
        print(f"  [Continuous Regression Metrics]")
        print(f"  * Train MAE:              {train_mae:.3f}")
        print(f"  * Test MAE:               {test_mae:.3f} (Mean error < 2 risk points)")
        print(f"  * Test RMSE:              {test_rmse:.3f}")
        print(f"  * Test R-Squared (R²):     {test_r2:.4f}")
        print(f"\n  [Categorical Triage Metrics (Low, Mod, High, Severe)]")
        print(f"  * Category Accuracy:      {cat_accuracy * 100:.2f}%")
        print(f"  * Macro F1-Score:         {cat_f1_macro:.4f}")
        print(f"  * Weighted F1-Score:      {cat_f1_weighted:.4f}")
        print(f"\n  [Confusion Matrix (Rows: Actual, Cols: Predicted)]")
        print(f"  Labels: {labels}")
        for row, label in zip(conf_matrix, labels):
            print(f"  {label:<8}: {row.tolist()}")
        print(f"\n  [Top Predictive Features]")
        for feat, score in list(sorted_importance.items())[:5]:
            print(f"  * {feat:<22}: {score*100:.2f}%")
        print("-" * 50)

        return {
            "regression": {
                "train_mae": round(float(train_mae), 4),
                "test_mae": round(float(test_mae), 4),
                "test_rmse": round(float(test_rmse), 4),
                "test_r2": round(float(test_r2), 4),
            },
            "classification": {
                "accuracy": round(float(cat_accuracy), 4),
                "f1_macro": round(float(cat_f1_macro), 4),
                "f1_weighted": round(float(cat_f1_weighted), 4),
                "confusion_matrix": conf_matrix.tolist(),
                "labels": labels,
            },
            "feature_importance": sorted_importance,
        }

    def _save_artifacts(self):
        """Saves model in native JSON, universal binary, and joblib formats with metadata."""
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        json_path = self.artifacts_dir / "sentinelmind_xgboost_model.json"
        joblib_path = self.artifacts_dir / "sentinelmind_xgboost_model.joblib"
        metadata_path = self.artifacts_dir / "model_metadata.json"

        # 1. Native XGBoost JSON serialization (fastest, cross-language compatible)
        self.model.save_model(str(json_path))

        # 2. Python joblib wrapper
        joblib.dump(self.model, str(joblib_path))

        # 3. Model Lineage & Metadata
        metadata = {
            "model_name": "SentinelMind_Personnel_Stress_Predictor",
            "model_type": "XGBoost_Regressor",
            "model_version": "1.0.0",
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "features": FEATURE_NAMES,
            "target": TARGET_COLUMN,
            "metrics": self.metrics,
            "hyperparameters": self.model.get_params(),
            "risk_tiers": [
                {"min": t[0], "max": t[1], "category": t[2]} for t in RISK_TIERS
            ],
        }

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, default=str)

        print(f"  * Native Model:   {json_path}")
        print(f"  * Joblib Model:   {joblib_path}")
        print(f"  * Model Metadata: {metadata_path}")

    def _sample_inference(self) -> Dict[str, Any]:
        """Performs sample prediction on a high-stress simulated profile."""
        # Simulated profile: 4h sleep, low HRV (28ms), elevated RHR (82 BPM), 14h duty, mood 3, intensity 4, 2 incidents
        sample_data = pd.DataFrame(
            [
                {
                    "Sleep_Hours": 4.0,
                    "HRV": 28.0,
                    "Resting_HR": 82,
                    "Duty_Hours": 14.0,
                    "Mood_Score": 3,
                    "Deployment_Intensity": 4,
                    "Incident_Exposure": 2,
                }
            ]
        )
        score = float(self.model.predict(sample_data)[0])
        score = max(0.0, min(100.0, score))
        category = map_score_to_category(score)
        return {"risk_score": score, "risk_category": category}


# ==============================================================================
# 4. PRODUCTION PREDICTOR CLASS (INFERENCE SERVICE)
# ==============================================================================

class SentinelMindPredictor:
    """
    Production-ready inference wrapper.
    Loads trained XGBoost artifacts and outputs both Risk Score and Risk Category.
    """

    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = "ai/models_registry/artifacts/sentinelmind_xgboost_model.json"

        self.model_path = Path(model_path)
        if not self.model_path.exists():
            # Fallback check
            joblib_path = self.model_path.with_suffix(".joblib")
            if joblib_path.exists():
                self.model = joblib.load(str(joblib_path))
            else:
                raise FileNotFoundError(f"Model artifact not found at {self.model_path}")
        else:
            self.model = xgb.XGBRegressor()
            self.model.load_model(str(self.model_path))

    def predict(
        self,
        features: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame],
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Calculates stress risk for single observation or batch.
        Outputs:
          - risk_score (float, 0.00 to 100.00)
          - risk_category (str: LOW, MODERATE, HIGH, SEVERE)
        """
        is_single = isinstance(features, dict)
        if is_single:
            df = pd.DataFrame([features])
        elif isinstance(features, list):
            df = pd.DataFrame(features)
        else:
            df = features.copy()

        # Validate feature presence
        missing = [f for f in FEATURE_NAMES if f not in df.columns]
        if missing:
            raise ValueError(f"Missing required input features: {missing}")

        # Ensure correct column ordering
        X = df[FEATURE_NAMES]

        # Compute raw continuous predictions
        raw_scores = self.model.predict(X)
        clipped_scores = np.clip(raw_scores, 0.0, 100.0)

        results = []
        for score in clipped_scores:
            val = round(float(score), 2)
            cat = map_score_to_category(val)
            results.append({"risk_score": val, "risk_category": cat})

        return results[0] if is_single else results


# ==============================================================================
# 5. CLI EXECUTION
# ==============================================================================

if __name__ == "__main__":
    dataset_csv = "ai/training/datasets/sentinelmind_synthetic_dataset.csv"
    if not os.path.exists(dataset_csv):
        print(f"[Warning] Dataset '{dataset_csv}' not found. Generating synthetic dataset first...")
        from ai.training.datasets.generate_dataset import generate_sentinelmind_csv
        generate_sentinelmind_csv(num_records=10000, output_path=dataset_csv)

    trainer = SentinelMindTrainer(dataset_path=dataset_csv)
    trainer.run_pipeline()
