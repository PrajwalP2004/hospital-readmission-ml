"""
Hospital Readmission Risk — Flask API
======================================
Endpoints
---------
POST /predict  – Patient data  → readmission risk percentage + label
POST /chat     – Risk score + doctor question → clinical suggestion (OpenAI)
GET  /health   – Liveness probe
GET  /schema   – Returns expected input schema

The model artefacts (full_pipeline.joblib, pipeline_meta.json) are loaded
once at startup from the same directory as this file.
"""

import json
import os
import sys
import logging

import joblib
import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
log = logging.getLogger(__name__)

# ── Load environment variables (.env) ────────────────────────────────────────
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    log.warning(
        "OPENAI_API_KEY is not set. The /chat endpoint will return an error "
        "until the key is provided in the .env file."
    )

# ── Paths (resolve relative to this file so the server can be run from anywhere)
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
PIPELINE_PATH  = os.path.join(BASE_DIR, "full_pipeline.joblib")
META_PATH      = os.path.join(BASE_DIR, "pipeline_meta.json")
SCHEMA_PATH    = os.path.join(BASE_DIR, "schema.json")

# ── Feature definitions (must match train_model.py exactly) ──────────────────
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

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

# Sensible defaults so callers only need to supply the fields they know
DEFAULTS = {
    "time_in_hospital": 3, "num_lab_procedures": 40, "num_procedures": 0,
    "num_medications": 10, "number_outpatient": 0, "number_emergency": 0,
    "number_inpatient": 0, "number_diagnoses": 5,
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

# ── Load artefacts at startup ─────────────────────────────────────────────────
log.info("Loading ML artefacts …")
try:
    pipeline = joblib.load(PIPELINE_PATH)
    log.info("  ✓  full_pipeline.joblib loaded")
except FileNotFoundError:
    log.error(
        f"Pipeline not found at '{PIPELINE_PATH}'. "
        "Run train_model.py to generate artefacts, then restart the server."
    )
    sys.exit(1)

THRESHOLD = 0.5
if os.path.exists(META_PATH):
    with open(META_PATH) as f:
        meta = json.load(f)
    THRESHOLD = meta.get("threshold", 0.5)
    log.info(f"  ✓  pipeline_meta.json loaded  (threshold={THRESHOLD:.4f})")

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "*").split(","))

# ── OpenAI client ─────────────────────────────────────────────────────────────
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# ─────────────────────────────────────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def _validate_and_fill(data: dict) -> dict:
    """Apply defaults for missing keys; coerce numerics; return clean dict."""
    processed = dict(DEFAULTS)
    processed.update(data)

    errors = []
    for field in NUMERICAL_FEATURES:
        try:
            processed[field] = float(processed[field])
        except (ValueError, TypeError):
            errors.append(
                f"'{field}' must be numeric, got: {processed[field]!r}"
            )
    if errors:
        raise ValueError("Validation failed: " + "; ".join(errors))

    return processed


def _risk_label(probability: float) -> str:
    if probability >= 0.65:
        return "High"
    if probability >= 0.40:
        return "Medium"
    return "Low"


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Liveness probe."""
    return jsonify({"status": "ok", "threshold": round(THRESHOLD, 4)}), 200


@app.route("/schema", methods=["GET"])
def schema():
    """Return the expected input schema for /predict."""
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH) as f:
            return jsonify(json.load(f)), 200
    # Fallback: return feature lists
    return jsonify({
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "defaults": DEFAULTS,
    }), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict hospital readmission risk.

    Accepts
    -------
    JSON body with any subset of the model's features.
    Missing fields are filled with sensible defaults.

    Returns
    -------
    {
        "risk_percentage": float,   # 0 – 100
        "risk_level":     str,      # "Low" | "Medium" | "High"
        "prediction":     int,      # 0 or 1  (using optimised threshold)
        "label":          str,      # human-readable
        "probability":    float,    # raw model probability
        "threshold":      float     # decision threshold used
    }
    """
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "Request body must be JSON."}), 400

    try:
        data = _validate_and_fill(body)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 422

    # Build a single-row DataFrame in the exact feature order the pipeline expects
    row = {f: [data.get(f, DEFAULTS.get(f, "Unknown"))] for f in ALL_FEATURES}
    df = pd.DataFrame(row)

    try:
        prob       = float(pipeline.predict_proba(df)[0][1])
        prediction = int(prob >= THRESHOLD)
        label      = ("Readmitted within 30 days"
                      if prediction == 1 else "Not likely readmitted")

        log.info(
            f"/predict  prob={prob:.4f}  pred={prediction}  "
            f"threshold={THRESHOLD:.4f}"
        )

        return jsonify({
            "risk_percentage": round(prob * 100, 2),
            "risk_level":      _risk_label(prob),
            "prediction":      prediction,
            "label":           label,
            "probability":     round(prob, 4),
            "threshold":       round(THRESHOLD, 4),
        }), 200

    except Exception as exc:  # noqa: BLE001
        log.exception("Prediction error")
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.route("/chat", methods=["POST"])
def chat():
    """
    Generate a clinical suggestion using OpenAI.

    Accepts
    -------
    {
        "risk_score":  float,   # readmission risk % (0–100)
        "risk_level":  str,     # optional – "Low" | "Medium" | "High"
        "question":    str      # doctor's clinical question
    }

    Returns
    -------
    {
        "suggestion":  str,     # AI clinical recommendation
        "model":       str      # OpenAI model used
    }
    """
    if openai_client is None:
        return jsonify({
            "error": (
                "OpenAI API key is not configured. "
                "Add OPENAI_API_KEY to your .env file and restart the server."
            )
        }), 503

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "Request body must be JSON."}), 400

    risk_score = body.get("risk_score")
    question   = body.get("question", "").strip()
    risk_level = body.get("risk_level", _risk_label((risk_score or 0) / 100))

    if risk_score is None:
        return jsonify({"error": "'risk_score' is required."}), 422
    if not question:
        return jsonify({"error": "'question' is required and must not be empty."}), 422

    # ── System prompt: CDC / WHO discharge guideline grounding ────────────────
    system_prompt = """You are a senior clinical decision-support assistant integrated \
into a hospital discharge planning system. Your role is to help physicians make \
evidence-based decisions about patient discharge and post-care planning.

Guidelines you follow:
- CDC guidelines on hospital readmission reduction (https://www.cdc.gov)
- WHO discharge planning recommendations
- Joint Commission standards for patient safety

When responding:
1. Be concise, professional, and clinically precise.
2. Always ground your suggestion in the patient's computed readmission risk score.
3. Recommend appropriate follow-up (outpatient visit within 7 days for High risk, \
14 days for Medium risk, 30 days for Low risk).
4. Flag medication reconciliation needs when risk is Medium or High.
5. Suggest patient education topics relevant to the risk level.
6. Never diagnose; only advise on discharge planning and follow-up care.
7. If the question falls outside clinical discharge planning, politely redirect."""

    user_message = (
        f"Patient readmission risk assessment:\n"
        f"  • Risk Score : {risk_score:.1f}%\n"
        f"  • Risk Level : {risk_level}\n\n"
        f"Doctor's question: {question}"
    )

    try:
        OPENAI_MODEL = "gpt-4o-mini"
        log.info(f"/chat  risk={risk_score}%  level={risk_level}  model={OPENAI_MODEL}")

        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.3,     # low temperature → consistent clinical tone
            max_tokens=512,
        )

        suggestion = response.choices[0].message.content.strip()
        return jsonify({
            "suggestion": suggestion,
            "model":      OPENAI_MODEL,
        }), 200

    except Exception as exc:  # noqa: BLE001
        log.exception("OpenAI call failed")
        return jsonify({"error": f"OpenAI request failed: {exc}"}), 502


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    log.info(f"Starting Hospital Readmission API on port {port} …")
    app.run(debug=debug, host="0.0.0.0", port=port)
