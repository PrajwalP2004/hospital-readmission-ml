"""
train_model.py
Production-ready training pipeline for hospital readmission prediction.

Architecture:
  ColumnTransformer (StandardScaler + OneHotEncoder)
    -> RandomForestClassifier
  Bundled into a single sklearn Pipeline.

Steps:
  1. Load & reconstruct raw categoricals from pre-encoded CSV
  2. Build Pipeline (preprocessing + model)
  3. Stratified 5-fold CV with full metrics
  4. RandomizedSearchCV hyperparameter tuning
  5. Optimise classification threshold via precision-recall curve
  6. Export full_pipeline.joblib
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (
    StratifiedKFold, cross_validate, RandomizedSearchCV, train_test_split
)
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score,
    precision_recall_curve, classification_report
)

warnings.filterwarnings("ignore")

# ─── Paths ──────────────────────────────────────────────────────────────────
_BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR   = os.path.dirname(_BASE_DIR)
DATA_PATH   = os.path.join(_ROOT_DIR, "data", "train.csv")
OUTPUT_PATH = os.path.join(_BASE_DIR, "artifacts", "full_pipeline.joblib")
META_PATH   = os.path.join(_BASE_DIR, "artifacts", "pipeline_meta.json")

# ─── Feature definitions ─────────────────────────────────────────────────────
NUMERICAL_FEATURES = [
    "time_in_hospital", "num_lab_procedures", "num_procedures",
    "num_medications", "number_outpatient", "number_emergency",
    "number_inpatient", "number_diagnoses",
]

CATEGORICAL_FEATURES = [
    "race", "gender", "age", "payer_code", "medical_specialty",
    "diag_1", "diag_2", "diag_3", "max_glu_serum", "A1Cresult",
    "metformin", "repaglinide", "nateglinide", "chlorpropamide",
    "glimepiride", "glipizide", "glyburide", "tolbutamide",
    "pioglitazone", "rosiglitazone", "acarbose", "miglitol",
    "troglitazone", "tolazamide", "insulin", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone",
    "change", "diabetesMed",
]

# Mapping of one-hot prefixes to raw column names (for reconstruction)
OHE_PREFIXES = {
    "race": ["Caucasian", "AfricanAmerican"],
    "gender": ["Female"],
    "age": ["[70-80)", "[60-70)", "[50-60)", "[80-90)", "[40-50)"],
    "payer_code": ["?", "MC", "HM", "SP", "BC"],
    "medical_specialty": ["?", "InternalMedicine", "Emergency/Trauma",
                          "Family/GeneralPractice", "Cardiology"],
    "diag_1": ["428", "414", "786"],
    "diag_2": ["276", "428", "250", "427"],
    "diag_3": ["250", "401", "276", "428"],
    "max_glu_serum": ["None"],
    "A1Cresult": ["None"],
    "metformin": ["No"],
    "repaglinide": ["No"],
    "nateglinide": ["No"],
    "chlorpropamide": ["No"],
    "glimepiride": ["No"],
    "glipizide": ["No"],
    "glyburide": ["No"],
    "tolbutamide": ["No"],
    "pioglitazone": ["No"],
    "rosiglitazone": ["No"],
    "acarbose": ["No"],
    "miglitol": ["No"],
    "troglitazone": ["No"],
    "tolazamide": ["No"],
    "insulin": ["No"],
    "glyburide-metformin": ["No"],
    "glipizide-metformin": ["No"],
    "glimepiride-pioglitazone": ["No"],
    "change": ["No"],
    "diabetesMed": ["Yes"],
}

TARGET = "readmitted"


# ─── Step 1: Load & reconstruct raw categoricals ────────────────────────────
def load_and_reconstruct(path: str) -> pd.DataFrame:
    print(f"\n{'='*55}")
    print("  STEP 1: Loading and reconstructing raw features")
    print(f"{'='*55}")

    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path)
    # Cast all bool columns to int up front so comparisons work cleanly
    bool_cols = df.select_dtypes(include="bool").columns
    df[bool_cols] = df[bool_cols].astype(int)

    print(f"  Loaded   : {df.shape[0]:,} rows x {df.shape[1]} cols")

    raw = pd.DataFrame(index=df.index)

    # Copy numerical features
    for col in NUMERICAL_FEATURES:
        raw[col] = df[col]

    # Vectorised reconstruction of categorical features from one-hot columns
    for feat, values in OHE_PREFIXES.items():
        raw[feat] = "Other"  # default
        for val in values:
            col = f"{feat}_{val}"
            if col in df.columns:
                mask = df[col] == 1
                raw.loc[mask, feat] = val

    raw[TARGET] = df[TARGET]
    print(f"  Reconstructed: {raw.shape[1] - 1} features + target")
    print(f"  Target dist  : {raw[TARGET].value_counts().to_dict()}")
    return raw


# ─── Step 2: Build Pipeline ──────────────────────────────────────────────────
def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(transformers=[
        ("num", StandardScaler(), NUMERICAL_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False),
         CATEGORICAL_FEATURES),
    ])

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=100, class_weight="balanced",
            random_state=42, n_jobs=-1
        )),
    ])
    return pipeline


# ─── Step 3: Stratified 5-Fold Cross-Validation ──────────────────────────────
def cross_validate_pipeline(pipeline: Pipeline, X: pd.DataFrame,
                             y: pd.Series) -> dict:
    print(f"\n{'='*55}")
    print("  STEP 3: Stratified 5-Fold Cross-Validation")
    print(f"{'='*55}")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "accuracy":  "accuracy",
        "precision": "precision",
        "recall":    "recall",
        "f1":        "f1",
        "roc_auc":   "roc_auc",
        "auprc":     "average_precision",
    }

    results = cross_validate(pipeline, X, y, cv=cv, scoring=scoring,
                              return_train_score=False, n_jobs=1)

    summary = {}
    for metric in scoring:
        scores = results[f"test_{metric}"]
        summary[metric] = {"mean": float(scores.mean()), "std": float(scores.std())}
        print(f"  {metric:<12}: {scores.mean():.4f} +/- {scores.std():.4f}")

    return summary


# ─── Step 4: Hyperparameter Tuning ───────────────────────────────────────────
def tune_pipeline(pipeline: Pipeline, X_train: pd.DataFrame,
                  y_train: pd.Series) -> Pipeline:
    print(f"\n{'='*55}")
    print("  STEP 4: RandomizedSearchCV Hyperparameter Tuning")
    print(f"{'='*55}")

    param_dist = {
        "classifier__n_estimators":  [100, 150, 200, 250],
        "classifier__max_depth":     [None, 10, 15, 20],
        "classifier__min_samples_leaf": [1, 2, 4],
        "classifier__max_features":  ["sqrt", "log2", 0.5],
    }

    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    search = RandomizedSearchCV(
        pipeline, param_distributions=param_dist,
        n_iter=12, scoring="f1", cv=cv,
        random_state=42, n_jobs=1, verbose=0
    )
    search.fit(X_train, y_train)

    print(f"  Best F1 (CV) : {search.best_score_:.4f}")
    print(f"  Best params  :")
    for k, v in search.best_params_.items():
        print(f"    {k.replace('classifier__', ''):<25}: {v}")

    return search.best_estimator_


# ─── Step 5: Threshold Optimisation ─────────────────────────────────────────
def optimise_threshold(pipeline: Pipeline, X_val: pd.DataFrame,
                        y_val: pd.Series, min_recall: float = 0.70) -> float:
    print(f"\n{'='*55}")
    print("  STEP 5: Threshold Optimisation (target recall >= 0.70)")
    print(f"{'='*55}")

    y_prob = pipeline.predict_proba(X_val)[:, 1]
    precisions, recalls, thresholds = precision_recall_curve(y_val, y_prob)

    # Among thresholds where recall >= min_recall, pick highest precision
    best_thresh = 0.5
    best_f1 = 0.0
    for p, r, t in zip(precisions, recalls, thresholds):
        if r >= min_recall:
            f1 = 2 * p * r / (p + r + 1e-9)
            if f1 > best_f1:
                best_f1 = f1
                best_thresh = t

    y_pred = (y_prob >= best_thresh).astype(int)
    print(f"  Optimal threshold : {best_thresh:.4f}")
    print(f"  Threshold F1      : {best_f1:.4f}")
    print(f"  Threshold Recall  : {recall_score(y_val, y_pred):.4f}")
    print(f"  Threshold Precision: {precision_score(y_val, y_pred):.4f}")
    return float(best_thresh)


# ─── Step 6: Final Evaluation ────────────────────────────────────────────────
def evaluate_final(pipeline: Pipeline, X_test: pd.DataFrame,
                   y_test: pd.Series, threshold: float) -> dict:
    print(f"\n{'='*55}")
    print("  STEP 6: Final Evaluation on Hold-Out Test Set")
    print(f"{'='*55}")

    y_prob = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= threshold).astype(int)

    metrics = {
        "accuracy":  round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall":    round(recall_score(y_test, y_pred), 4),
        "f1":        round(f1_score(y_test, y_pred), 4),
        "roc_auc":   round(roc_auc_score(y_test, y_prob), 4),
        "auprc":     round(average_precision_score(y_test, y_prob), 4),
        "threshold": round(threshold, 4),
    }

    print(f"  {'Metric':<12} {'Score':>8}")
    print(f"  {'-'*22}")
    for k, v in metrics.items():
        print(f"  {k:<12} {v:>8}")

    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred,
                                 target_names=["Not Readmitted", "Readmitted"]))
    return metrics


# ─── Step 7: Feature Importance ──────────────────────────────────────────────
def print_feature_importance(pipeline: Pipeline, top_n: int = 15) -> None:
    print(f"\n{'='*55}")
    print(f"  STEP 7: Top-{top_n} Feature Importances")
    print(f"{'='*55}")

    ohe = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    cat_names = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_names = NUMERICAL_FEATURES + cat_names

    importances = pipeline.named_steps["classifier"].feature_importances_
    series = pd.Series(importances, index=all_names).nlargest(top_n)

    for feat, score in series.items():
        bar = "=" * int(score * 300)
        print(f"  {feat:<45} {score:.4f}  {bar}")


# ─── Step 8: Export ──────────────────────────────────────────────────────────
def export(pipeline: Pipeline, threshold: float, cv_summary: dict,
           final_metrics: dict) -> None:
    print(f"\n{'='*55}")
    print("  STEP 8: Exporting artefacts")
    print(f"{'='*55}")

    joblib.dump(pipeline, OUTPUT_PATH)
    print(f"  full_pipeline.joblib  [OK]   ({os.path.getsize(OUTPUT_PATH)/1e6:.1f} MB)")

    meta = {
        "threshold": threshold,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "cv_metrics": cv_summary,
        "final_metrics": final_metrics,
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  pipeline_meta.json    [OK]")


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    # 1. Load data
    df  = load_and_reconstruct(DATA_PATH)
    X   = df.drop(columns=[TARGET])
    y   = df[TARGET]

    # Train / val / test split  (60 / 20 / 20)
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.25, random_state=42, stratify=y_train_val
    )  # 0.25 x 0.80 = 0.20 overall

    print(f"\n  Split summary: train={len(X_train):,} | val={len(X_val):,} | test={len(X_test):,}")

    # 2. Build base pipeline
    base_pipeline = build_pipeline()

    # 3. Cross-validate (on train+val combined to mirror real CV practice)
    cv_summary = cross_validate_pipeline(base_pipeline, X_train_val, y_train_val)

    # 4. Tune on train set
    best_pipeline = tune_pipeline(build_pipeline(), X_train, y_train)

    # 5. Optimise threshold on val set
    threshold = optimise_threshold(best_pipeline, X_val, y_val, min_recall=0.70)

    # 6. Final evaluation on held-out test set
    final_metrics = evaluate_final(best_pipeline, X_test, y_test, threshold)

    # 7. Feature importances
    print_feature_importance(best_pipeline)

    # 8. Export
    export(best_pipeline, threshold, cv_summary, final_metrics)

    print("\n  DONE: Production pipeline complete.\n")


if __name__ == "__main__":
    main()
