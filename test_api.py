"""
test_api.py — Unit tests for Hospital Readmission Risk API
===========================================================
Uses Flask's built-in test client (no running server required).
Run:  python -m pytest test_api.py -v
"""

import json
import pytest
from app import app


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Yield a Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


SAMPLE_PATIENT = {
    "time_in_hospital": 14,
    "num_lab_procedures": 41,
    "num_procedures": 1,
    "num_medications": 11,
    "number_outpatient": 0,
    "number_emergency": 0,
    "number_inpatient": 0,
    "number_diagnoses": 6,
    "race": "Caucasian",
    "gender": "Female",
    "age": "[70-80)",
    "medical_specialty": "InternalMedicine",
    "insulin": "No",
    "diabetesMed": "Yes",
}


# ── GET /health ───────────────────────────────────────────────────────────────

def test_health(client):
    """GET /health should return 200 with status 'ok'."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"
    assert "threshold" in data


# ── GET /schema ───────────────────────────────────────────────────────────────

def test_schema(client):
    """GET /schema should return 200 with input feature definitions."""
    resp = client.get("/schema")
    assert resp.status_code == 200
    data = resp.get_json()
    # schema.json has an "input_features" key
    assert "input_features" in data or "numerical_features" in data


# ── POST /predict ─────────────────────────────────────────────────────────────

def test_predict_with_defaults(client):
    """POST /predict with minimal body should fill defaults and return risk."""
    resp = client.post(
        "/predict",
        data=json.dumps({"time_in_hospital": 5}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert 0 <= data["risk_percentage"] <= 100
    assert data["risk_level"] in ("Low", "Medium", "High")
    assert data["prediction"] in (0, 1)
    assert "label" in data
    assert "probability" in data
    assert "threshold" in data


def test_predict_full_payload(client):
    """POST /predict with a full patient payload should return 200."""
    resp = client.post(
        "/predict",
        data=json.dumps(SAMPLE_PATIENT),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert 0 <= data["risk_percentage"] <= 100
    assert data["risk_level"] in ("Low", "Medium", "High")


def test_predict_empty_body_returns_400(client):
    """POST /predict with no JSON body should return 400."""
    resp = client.post("/predict", data="not json", content_type="text/plain")
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_predict_bad_numeric_returns_422(client):
    """POST /predict with a non-numeric value for a numeric field → 422."""
    resp = client.post(
        "/predict",
        data=json.dumps({"time_in_hospital": "abc"}),
        content_type="application/json",
    )
    assert resp.status_code == 422
    data = resp.get_json()
    assert "error" in data
    assert "numeric" in data["error"].lower()


# ── POST /chat ────────────────────────────────────────────────────────────────

def test_chat_missing_risk_score(client):
    """POST /chat without risk_score should return 422 (or 503 if no key)."""
    resp = client.post(
        "/chat",
        data=json.dumps({"question": "Is early discharge safe?"}),
        content_type="application/json",
    )
    # 503 if OpenAI key is not configured, 422 if it is but risk_score missing
    assert resp.status_code in (422, 503)


def test_chat_missing_question(client):
    """POST /chat without a question should return 422 (or 503 if no key)."""
    resp = client.post(
        "/chat",
        data=json.dumps({"risk_score": 72.5}),
        content_type="application/json",
    )
    assert resp.status_code in (422, 503)


def test_chat_no_body_returns_400(client):
    """POST /chat with no JSON body should return 400 (or 503 if no key)."""
    resp = client.post("/chat", data="not json", content_type="text/plain")
    assert resp.status_code in (400, 503)
