"""
test_api.py — Unit tests for hardened Hospital Readmission Risk API
==================================================================
Uses Flask's built-in test client.
Run:  python -m pytest tests/test_api.py -v
"""

import json
import pytest
import sys
import os
import tempfile

# Add project root to path so imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set dummy env vars for testing before importing app
os.environ["DATABASE_PATH"] = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
os.environ["JWT_SECRET"] = "test-secret"

from server.app import app
from server.database import init_db

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Initialise the test database once per session."""
    with app.app_context():
        init_db()
    yield
    # Cleanup
    if os.path.exists(os.environ["DATABASE_PATH"]):
        os.remove(os.environ["DATABASE_PATH"])


@pytest.fixture
def client():
    """Yield a Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


@pytest.fixture
def auth_headers(client):
    """Register and login a test patient to get headers."""
    # Register
    client.post(
        "/auth/register",
        json={"name": "Test Patient", "password": "password123", "age": "30"}
    )
    # Login
    resp = client.post(
        "/auth/login",
        json={"identifier": "Test Patient", "password": "password123"}
    )
    data = resp.get_json()
    token = data["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client):
    """Get headers for the seeded admin clinician."""
    resp = client.post(
        "/auth/login",
        json={"identifier": "Clinician Admin", "password": "admin123"}
    )
    data = resp.get_json()
    token = data["token"]
    return {"Authorization": f"Bearer {token}"}


# ── Constants ────────────────────────────────────────────────────────────────

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


# ── Health & Schema ──────────────────────────────────────────────────────────

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"


def test_schema(client):
    resp = client.get("/schema")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "numerical_features" in data or "input_features" in data


# ── Authentication ────────────────────────────────────────────────────────────

def test_register_and_login(client):
    # Register unique user
    reg_resp = client.post(
        "/auth/register",
        json={"name": "New User", "password": "password123", "age": "25"}
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.get_json()
    assert "token" in reg_data
    assert reg_data["user"]["name"] == "New User"
    assert "MRN-" in reg_data["user"]["mrn"]

    # Login
    login_resp = client.post(
        "/auth/login",
        json={"identifier": "New User", "password": "password123"}
    )
    assert login_resp.status_code == 200
    assert "token" in login_resp.get_json()


def test_login_invalid_credentials(client):
    resp = client.post(
        "/auth/login",
        json={"identifier": "NonExistent", "password": "wrong"}
    )
    assert resp.status_code == 401


# ── Prediction (Protected) ────────────────────────────────────────────────────

def test_predict_requires_auth(client):
    resp = client.post("/predict", json={"time_in_hospital": 5})
    assert resp.status_code == 401


def test_predict_with_auth(client, auth_headers):
    resp = client.post(
        "/predict",
        json={"time_in_hospital": 5},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "risk_level" in data
    assert "probability" in data


# ── Patients & Analytics (Restricted) ─────────────────────────────────────────

def test_patients_list_requires_clinician(client, auth_headers):
    # Patient tries to access clinician-only route
    resp = client.get("/patients", headers=auth_headers)
    assert resp.status_code == 403


def test_patients_list_for_admin(client, admin_headers):
    resp = client.get("/patients", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "patients" in data
    assert "total" in data


def test_analytics_requires_clinician(client, auth_headers):
    resp = client.get("/analytics/summary", headers=auth_headers)
    assert resp.status_code == 403


def test_analytics_for_admin(client, admin_headers):
    resp = client.get("/analytics/summary", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "total_patients" in data
    assert "high_risk_count" in data
