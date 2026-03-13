"""
Hospital Readmission Risk — Flask API (Production)
====================================================
Endpoints
---------
Auth:
  POST /auth/register  – Create patient account
  POST /auth/login     – Authenticate, return JWT
  GET  /auth/me        – Current user from token

Patients:
  GET  /patients       – List patients (paginated, filterable)
  POST /patients       – Create patient record
  GET  /patients/<mrn> – Get single patient

Prediction:
  POST /predict        – Patient data → readmission risk
  GET  /schema         – Expected input schema

Analytics:
  GET  /analytics/summary – Aggregate risk stats

Infra:
  GET  /health         – Liveness probe
"""

import os
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

from server.predict import (
    predict_readmission, SCHEMA_PATH, ALL_FEATURES,
    NUMERICAL_FEATURES, CATEGORICAL_FEATURES, DEFAULTS
)
from server.auth import auth_bp, require_auth, require_role, _hash_password
from server.database import (
    init_db, seed_patients_from_json, seed_admin_user,
    get_all_patients, get_patient_by_mrn, create_patient, update_patient,
    get_analytics_summary,
)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# ── Load environment variables ───────────────────────────────────────────────
load_dotenv()

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)

# CORS — restrict origins in production
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
CORS(app, origins=cors_origins, supports_credentials=True)

# Rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per minute"],
    storage_uri="memory://",
)

# Register auth blueprint
app.register_blueprint(auth_bp)

# ── Database init ─────────────────────────────────────────────────────────────
with app.app_context():
    init_db()
    # Seed admin with default password (change in production via env)
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    seed_admin_user(_hash_password(admin_password))
    seed_patients_from_json()


# ─────────────────────────────────────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def _risk_label(probability: float) -> str:
    if probability >= 0.65:
        return "High"
    if probability >= 0.40:
        return "Medium"
    return "Low"


def _sanitize_input(value, max_length=200):
    """Sanitize string input."""
    if isinstance(value, str):
        import re
        clean = re.sub(r'<[^>]+>', '', value)
        return clean.strip()[:max_length]
    return value


# ─────────────────────────────────────────────────────────────────────────────
# Routes — Health & Schema
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Liveness probe."""
    return jsonify({"status": "ok"}), 200


@app.route("/schema", methods=["GET"])
def schema():
    """Return the expected input schema for /predict."""
    import json
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH) as f:
            return jsonify(json.load(f)), 200
    return jsonify({
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "defaults": DEFAULTS,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# Routes — Prediction
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/predict", methods=["POST"])
@require_auth
@limiter.limit("30 per minute")
def predict():
    """Predict hospital readmission risk."""
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "Request body must be JSON."}), 400

    # Sanitize all string inputs
    sanitized = {}
    for key, value in body.items():
        sanitized[key] = _sanitize_input(value) if isinstance(value, str) else value

    try:
        result = predict_readmission(sanitized)
        result["risk_level"] = _risk_label(result["probability"])
        result["risk_percentage"] = round(result["probability"] * 100, 2)

        logger.info(
            f"/predict  prob={result['probability']:.4f}  "
            f"threshold={result['threshold']:.4f}"
        )
        return jsonify(result), 200

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        logger.exception("Prediction error")
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Routes — Patients
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/patients", methods=["GET"])
@require_role('clinician')
def list_patients():
    """List patients with optional filters."""
    limit = min(int(request.args.get("limit", 500)), 1000)
    offset = int(request.args.get("offset", 0))
    risk = request.args.get("risk", None)
    search = request.args.get("search", None)

    patients, total = get_all_patients(limit=limit, offset=offset, risk_filter=risk, search=search)
    return jsonify({"patients": patients, "total": total}), 200


@app.route("/patients/<mrn>", methods=["GET"])
@require_auth
def get_patient(mrn):
    """Get a single patient by MRN."""
    patient = get_patient_by_mrn(mrn)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    return jsonify(patient), 200


@app.route("/patients", methods=["POST"])
@require_role('clinician')
def add_patient():
    """Create a new patient record."""
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON."}), 400

    if not body.get("mrn") or not body.get("name"):
        return jsonify({"error": "mrn and name are required."}), 400

    # Check duplicate
    existing = get_patient_by_mrn(body["mrn"])
    if existing:
        return jsonify({"error": "Patient with this MRN already exists."}), 409

    patient = create_patient(body)
    return jsonify(patient), 201


@app.route("/patients/<mrn>", methods=["PUT"])
@require_auth
def update_patient_route(mrn):
    """Update patient record."""
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON."}), 400

    patient = update_patient(mrn, body)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    return jsonify(patient), 200


# ─────────────────────────────────────────────────────────────────────────────
# Routes — Analytics
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/analytics/summary", methods=["GET"])
@require_role('clinician')
def analytics_summary():
    """Get aggregate analytics from patient data."""
    summary = get_analytics_summary()
    return jsonify(summary), 200


# ─────────────────────────────────────────────────────────────────────────────
# Static file serving (production: serve React build)
# ─────────────────────────────────────────────────────────────────────────────

_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")

if os.path.isdir(_DIST_DIR):
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        """Serve React SPA from dist/ folder."""
        file_path = os.path.join(_DIST_DIR, path)
        if path and os.path.isfile(file_path):
            return send_from_directory(_DIST_DIR, path)
        return send_from_directory(_DIST_DIR, "index.html")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    logger.info(f"Starting Hospital Readmission API on port {port} …")
    app.run(debug=debug, host="0.0.0.0", port=port)
