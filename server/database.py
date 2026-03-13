"""
database.py — SQLite persistence layer for MedPredict.

Tables:
  users    — id, name, mrn, password_hash, role, created_at
  patients — id, mrn, name, age, gender, admitted, risk_level,
             risk_probability, + all 38 clinical features
"""

import os
import json
import sqlite3
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_BASE_DIR)
DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join(_PROJECT_ROOT, "medpredict.db"))

# ─── Connection helper ───────────────────────────────────────────────────────

@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ─── Schema ──────────────────────────────────────────────────────────────────

def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                mrn         TEXT    UNIQUE NOT NULL,
                password_hash TEXT  NOT NULL,
                role        TEXT    NOT NULL DEFAULT 'patient',
                age         TEXT    DEFAULT '',
                created_at  TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS patients (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                mrn                 TEXT    UNIQUE NOT NULL,
                name                TEXT    NOT NULL,
                age                 TEXT    DEFAULT '',
                gender              TEXT    DEFAULT 'Female',
                admitted            TEXT    DEFAULT '',
                risk_level          TEXT    DEFAULT 'Unknown',
                risk_probability    REAL    DEFAULT 0.0,
                time_in_hospital    INTEGER DEFAULT 0,
                num_lab_procedures  INTEGER DEFAULT 0,
                num_procedures      INTEGER DEFAULT 0,
                num_medications     INTEGER DEFAULT 0,
                number_outpatient   INTEGER DEFAULT 0,
                number_emergency    INTEGER DEFAULT 0,
                number_inpatient    INTEGER DEFAULT 0,
                number_diagnoses    INTEGER DEFAULT 0,
                race                TEXT    DEFAULT 'Other',
                payer_code          TEXT    DEFAULT 'Other',
                medical_specialty   TEXT    DEFAULT 'Other',
                diag_1              TEXT    DEFAULT 'Other',
                diag_2              TEXT    DEFAULT 'Other',
                diag_3              TEXT    DEFAULT 'Other',
                max_glu_serum       TEXT    DEFAULT 'None',
                A1Cresult           TEXT    DEFAULT 'None',
                metformin           TEXT    DEFAULT 'No',
                insulin             TEXT    DEFAULT 'No',
                diabetesMed         TEXT    DEFAULT 'Yes',
                change              TEXT    DEFAULT 'No',
                created_at          TEXT    DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
            CREATE INDEX IF NOT EXISTS idx_patients_risk ON patients(risk_level);
            CREATE INDEX IF NOT EXISTS idx_users_mrn ON users(mrn);
        """)
    logger.info("Database tables initialised.")


# ─── Patient CRUD ────────────────────────────────────────────────────────────

PATIENT_FIELDS = [
    "mrn", "name", "age", "gender", "admitted", "risk_level", "risk_probability",
    "time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications",
    "number_outpatient", "number_emergency", "number_inpatient", "number_diagnoses",
    "race", "payer_code", "medical_specialty", "diag_1", "diag_2", "diag_3",
    "max_glu_serum", "A1Cresult", "metformin", "insulin", "diabetesMed", "change",
]


def _row_to_dict(row):
    """Convert sqlite3.Row to dict."""
    return dict(row) if row else None


def get_all_patients(limit=500, offset=0, risk_filter=None, search=None):
    """Fetch patients with optional filtering and pagination."""
    query = "SELECT * FROM patients WHERE 1=1"
    params = []

    if risk_filter and risk_filter != "all":
        query += " AND LOWER(risk_level) = LOWER(?)"
        params.append(risk_filter)

    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(mrn) LIKE ?)"
        term = f"%{search.lower()}%"
        params.extend([term, term])

    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        total = conn.execute(
            "SELECT COUNT(*) FROM patients" +
            (" WHERE LOWER(risk_level) = LOWER(?)" if risk_filter and risk_filter != "all" else ""),
            [risk_filter] if risk_filter and risk_filter != "all" else []
        ).fetchone()[0]

    return [_row_to_dict(r) for r in rows], total


def get_patient_by_mrn(mrn):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM patients WHERE mrn = ?", (mrn,)).fetchone()
    return _row_to_dict(row)


def create_patient(data: dict):
    """Insert a new patient record."""
    fields = [f for f in PATIENT_FIELDS if f in data]
    placeholders = ", ".join(["?"] * len(fields))
    columns = ", ".join(fields)
    values = [data[f] for f in fields]

    with get_db() as conn:
        conn.execute(f"INSERT INTO patients ({columns}) VALUES ({placeholders})", values)
        row = conn.execute("SELECT * FROM patients WHERE mrn = ?", (data["mrn"],)).fetchone()
    return _row_to_dict(row)


def update_patient(mrn: str, data: dict):
    """Update an existing patient record."""
    fields = [f for f in PATIENT_FIELDS if f in data and f != "mrn"]
    if not fields:
        return get_patient_by_mrn(mrn)

    set_clause = ", ".join([f"{f} = ?" for f in fields])
    values = [data[f] for f in fields] + [mrn]

    with get_db() as conn:
        conn.execute(f"UPDATE patients SET {set_clause} WHERE mrn = ?", values)
        row = conn.execute("SELECT * FROM patients WHERE mrn = ?", (mrn,)).fetchone()
    return _row_to_dict(row)


# ─── User CRUD ───────────────────────────────────────────────────────────────

def create_user(name, mrn, password_hash, role="patient", age=""):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO users (name, mrn, password_hash, role, age) VALUES (?, ?, ?, ?, ?)",
            (name, mrn, password_hash, role, age)
        )
        row = conn.execute("SELECT * FROM users WHERE mrn = ?", (mrn,)).fetchone()
    return _row_to_dict(row)


def get_user_by_mrn(mrn):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE mrn = ?", (mrn,)).fetchone()
    return _row_to_dict(row)


def get_user_by_name(name):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE LOWER(name) = LOWER(?)", (name,)).fetchone()
    return _row_to_dict(row)


# ─── Analytics ───────────────────────────────────────────────────────────────

def get_analytics_summary():
    """Compute aggregate analytics from patient data."""
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
        high = conn.execute("SELECT COUNT(*) FROM patients WHERE risk_level = 'High'").fetchone()[0]
        medium = conn.execute("SELECT COUNT(*) FROM patients WHERE risk_level = 'Medium'").fetchone()[0]
        low = conn.execute("SELECT COUNT(*) FROM patients WHERE risk_level = 'Low'").fetchone()[0]
        avg_risk = conn.execute("SELECT AVG(risk_probability) FROM patients WHERE risk_probability > 0").fetchone()[0] or 0
        avg_stay = conn.execute("SELECT AVG(time_in_hospital) FROM patients").fetchone()[0] or 0
        avg_meds = conn.execute("SELECT AVG(num_medications) FROM patients").fetchone()[0] or 0

    return {
        "total_patients": total,
        "high_risk_count": high,
        "medium_risk_count": medium,
        "low_risk_count": low,
        "avg_risk_probability": round(avg_risk, 2),
        "avg_hospital_stay": round(avg_stay, 1),
        "avg_medications": round(avg_meds, 1),
        "high_risk_pct": round((high / total * 100) if total else 0, 1),
    }


# ─── Seed data ───────────────────────────────────────────────────────────────

def seed_patients_from_json(json_path=None):
    """Load patients from public/data/patients.json if DB is empty."""
    if json_path is None:
        json_path = os.path.join(_PROJECT_ROOT, "public", "data", "patients.json")

    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
        if count > 0:
            logger.info(f"Database already has {count} patients, skipping seed.")
            return

    if not os.path.exists(json_path):
        logger.warning(f"Seed file not found: {json_path}")
        return

    logger.info(f"Seeding patients from {json_path} ...")
    with open(json_path, "r") as f:
        patients = json.load(f)

    with get_db() as conn:
        for p in patients[:500]:  # Limit seed to 500 for performance
            fields = [f for f in PATIENT_FIELDS if f in p]
            if "mrn" not in fields:
                continue
            placeholders = ", ".join(["?"] * len(fields))
            columns = ", ".join(fields)
            values = [p[f] for f in fields]
            try:
                conn.execute(f"INSERT OR IGNORE INTO patients ({columns}) VALUES ({placeholders})", values)
            except sqlite3.IntegrityError:
                pass

    with get_db() as conn:
        final_count = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    logger.info(f"Seeded {final_count} patients into database.")


def seed_admin_user(password_hash):
    """Create the admin clinician if not exists."""
    existing = get_user_by_mrn("ADM-001")
    if not existing:
        create_user("Clinician Admin", "ADM-001", password_hash, role="clinician")
        logger.info("Admin clinician seeded.")
