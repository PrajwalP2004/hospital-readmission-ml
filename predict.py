"""
predict.py
Production-ready inference module for hospital readmission prediction.

Usage:
    from predict import predict_readmission
    result = predict_readmission({"race": "Caucasian", "time_in_hospital": 5, ...})
"""

import os
import json
import joblib
import pandas as pd

# ─── Paths ───────────────────────────────────────────────────────────────────
PIPELINE_PATH = "full_pipeline.joblib"
META_PATH     = "pipeline_meta.json"

# ─── Required input fields ───────────────────────────────────────────────────
REQUIRED_NUMERICAL = [
    "time_in_hospital", "num_lab_procedures", "num_procedures",
    "num_medications", "number_outpatient", "number_emergency",
    "number_inpatient", "number_diagnoses",
]
REQUIRED_CATEGORICAL = [
    "race", "gender", "age", "payer_code", "medical_specialty",
    "diag_1", "diag_2", "diag_3", "max_glu_serum", "A1Cresult",
    "metformin", "repaglinide", "nateglinide", "chlorpropamide",
    "glimepiride", "glipizide", "glyburide", "tolbutamide",
    "pioglitazone", "rosiglitazone", "acarbose", "miglitol",
    "troglitazone", "tolazamide", "insulin", "glyburide-metformin",
    "glipizide-metformin", "glimepiride-pioglitazone",
    "change", "diabetesMed",
]
ALL_FEATURES = REQUIRED_NUMERICAL + REQUIRED_CATEGORICAL

# Default values used for optional fields not provided by caller
DEFAULTS = {
    # numerical
    "time_in_hospital": 3, "num_lab_procedures": 40, "num_procedures": 0,
    "num_medications": 10, "number_outpatient": 0, "number_emergency": 0,
    "number_inpatient": 0, "number_diagnoses": 5,
    # categorical
    "race": "Other", "gender": "Female", "age": "[50-60)",
    "payer_code": "Other", "medical_specialty": "Other",
    "diag_1": "Other", "diag_2": "Other", "diag_3": "Other",
    "max_glu_serum": "None", "A1Cresult": "None",
    "metformin": "No", "repaglinide": "No", "nateglinide": "No",
    "chlorpropamide": "No", "glimepiride": "No", "glipizide": "No",
    "glyburide": "No", "tolbutamide": "No", "pioglitazone": "No",
    "rosiglitazone": "No", "acarbose": "No", "miglitol": "No",
    "troglitazone": "No", "tolazamide": "No", "insulin": "No",
    "glyburide-metformin": "No", "glipizide-metformin": "No",
    "glimepiride-pioglitazone": "No", "change": "No", "diabetesMed": "Yes",
}


# ─── Load artefacts ──────────────────────────────────────────────────────────
def _load_artefacts():
    if not os.path.exists(PIPELINE_PATH):
        raise FileNotFoundError(
            f"Pipeline not found at '{PIPELINE_PATH}'. "
            "Run train_model.py first."
        )
    pipeline = joblib.load(PIPELINE_PATH)
    threshold = 0.5
    if os.path.exists(META_PATH):
        with open(META_PATH) as f:
            meta = json.load(f)
        threshold = meta.get("threshold", 0.5)
    return pipeline, threshold


# ─── Input validation ────────────────────────────────────────────────────────
def _validate_input(data: dict) -> dict:
    """Apply defaults for missing fields and validate numerical types."""
    processed = dict(DEFAULTS)   # start from defaults
    processed.update(data)       # overwrite with provided values

    errors = []
    for field in REQUIRED_NUMERICAL:
        try:
            processed[field] = float(processed[field])
        except (ValueError, TypeError):
            errors.append(f"  '{field}' must be numeric, got: {processed[field]!r}")

    if errors:
        raise ValueError("Input validation failed:\n" + "\n".join(errors))

    return processed


# ─── Public API ──────────────────────────────────────────────────────────────
def predict_readmission(input_data: dict) -> dict:
    """
    Predict hospital readmission from a raw, human-readable input dict.

    Parameters
    ----------
    input_data : dict
        Keys are feature names (e.g. 'race', 'time_in_hospital').
        Missing fields fall back to sensible defaults.

    Returns
    -------
    dict with keys:
        - prediction  : 0 or 1
        - label       : str description
        - probability : float (readmission probability)
        - threshold   : float used for decision
    """
    pipeline, threshold = _load_artefacts()
    validated = _validate_input(input_data)

    # Build a single-row DataFrame in the exact feature order the pipeline expects
    row = {f: [validated.get(f, DEFAULTS.get(f, "Unknown"))] for f in ALL_FEATURES}
    df  = pd.DataFrame(row)

    prob       = float(pipeline.predict_proba(df)[0][1])
    prediction = int(prob >= threshold)
    label      = "Readmitted within 30 days" if prediction == 1 else "Not likely readmitted"

    return {
        "prediction":  prediction,
        "label":       label,
        "probability": round(prob, 4),
        "threshold":   round(threshold, 4),
    }


# ─── CLI demo ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = {
        "time_in_hospital":    5,
        "num_lab_procedures":  45,
        "num_procedures":      1,
        "num_medications":     15,
        "number_outpatient":   0,
        "number_emergency":    0,
        "number_inpatient":    1,
        "number_diagnoses":    5,
        "race":                "Caucasian",
        "gender":              "Female",
        "age":                 "[60-70)",
        "payer_code":          "MC",
        "medical_specialty":   "InternalMedicine",
        "diag_1":              "428",
        "diag_2":              "250",
        "diag_3":              "401",
        "max_glu_serum":       "None",
        "A1Cresult":           "None",
        "metformin":           "No",
        "repaglinide":         "No",
        "nateglinide":         "No",
        "chlorpropamide":      "No",
        "glimepiride":         "No",
        "glipizide":           "No",
        "glyburide":           "No",
        "tolbutamide":         "No",
        "pioglitazone":        "No",
        "rosiglitazone":       "No",
        "acarbose":            "No",
        "miglitol":            "No",
        "troglitazone":        "No",
        "tolazamide":          "No",
        "insulin":             "No",
        "glyburide-metformin": "No",
        "glipizide-metformin": "No",
        "glimepiride-pioglitazone": "No",
        "change":              "No",
        "diabetesMed":         "Yes",
    }

    print("Hospital Readmission Prediction")
    print("-" * 40)
    result = predict_readmission(sample)
    for k, v in result.items():
        print(f"  {k:<15}: {v}")
