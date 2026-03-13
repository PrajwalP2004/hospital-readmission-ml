"""
auth.py — JWT authentication blueprint for MedPredict.

Endpoints:
  POST /auth/register  — Create new patient account
  POST /auth/login     — Authenticate and return JWT
  GET  /auth/me        — Get current user from token
"""

import os
import logging
import functools
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt
from flask import Blueprint, request, jsonify, g

from server.database import (
    create_user, get_user_by_mrn, get_user_by_name,
    create_patient, get_patient_by_mrn,
)

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

JWT_SECRET = os.getenv("JWT_SECRET", "medpredict-dev-secret-change-in-production")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

# ─── Helpers ─────────────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(user: dict) -> str:
    payload = {
        "mrn": user["mrn"],
        "name": user["name"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def _sanitize_string(value: str, max_length: int = 200) -> str:
    """Strip dangerous characters and limit length."""
    if not isinstance(value, str):
        return str(value)[:max_length]
    # Remove HTML tags
    import re
    clean = re.sub(r'<[^>]+>', '', value)
    return clean.strip()[:max_length]


def _user_response(user: dict) -> dict:
    """Return user dict without sensitive fields."""
    return {
        "mrn": user["mrn"],
        "name": user["name"],
        "role": user["role"],
        "age": user.get("age", ""),
        "created_at": user.get("created_at", ""),
    }


# ─── Auth decorator ─────────────────────────────────────────────────────────

def require_auth(f):
    """Decorator to protect endpoints with JWT."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token required."}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = _decode_token(token)
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401
        except Exception as e:
            logger.error(f"Auth error: {e}")
            return jsonify({"error": f"Authentication failed: {e}"}), 401

        return f(*args, **kwargs)
    return decorated


def require_role(role):
    """Decorator to restrict to a specific role."""
    def decorator(f):
        @functools.wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            if g.current_user.get("role") != role:
                return jsonify({"error": "Insufficient permissions."}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ─── Routes ──────────────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new patient account."""
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON."}), 400

    name = _sanitize_string(body.get("name", ""), 100)
    password = body.get("password", "")
    age = _sanitize_string(str(body.get("age", "")), 10)

    if not name or len(name) < 2:
        return jsonify({"error": "Name must be at least 2 characters."}), 400
    if not password or len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters."}), 400

    # Check duplicate name
    existing = get_user_by_name(name)
    if existing:
        return jsonify({"error": "An account with this name already exists."}), 409

    # Generate MRN
    import random
    mrn = f"MRN-{random.randint(100000, 999999)}"
    while get_user_by_mrn(mrn):
        mrn = f"MRN-{random.randint(100000, 999999)}"

    # Create user
    password_hash = _hash_password(password)
    user = create_user(name, mrn, password_hash, role="patient", age=age)

    # Create a matching patient record
    create_patient({
        "mrn": mrn,
        "name": name,
        "age": age,
        "gender": "Female",
        "admitted": datetime.now().strftime("%Y-%m-%d"),
        "risk_level": "Unknown",
        "risk_probability": 0.0,
    })

    token = _create_token(user)
    logger.info(f"New patient registered: {mrn}")

    return jsonify({
        "token": token,
        "user": _user_response(user),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login with name/MRN + password."""
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON."}), 400

    identifier = _sanitize_string(body.get("identifier", ""), 100)
    password = body.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Identifier and password are required."}), 400

    # Try MRN lookup first, then name
    user = get_user_by_mrn(identifier)
    if not user:
        user = get_user_by_name(identifier)

    if not user:
        return jsonify({"error": "Invalid credentials."}), 401

    if not _check_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid credentials."}), 401

    token = _create_token(user)

    # For patients, also fetch their patient record
    response = {"token": token, "user": _user_response(user)}
    if user["role"] == "patient":
        patient = get_patient_by_mrn(user["mrn"])
        if patient:
            response["patient"] = patient

    logger.info(f"User logged in: {user['mrn']} ({user['role']})")
    return jsonify(response), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def me():
    """Get the current authenticated user."""
    user = get_user_by_mrn(g.current_user["mrn"])
    if not user:
        return jsonify({"error": "User not found."}), 404

    response = {"user": _user_response(user)}
    if user["role"] == "patient":
        patient = get_patient_by_mrn(user["mrn"])
        if patient:
            response["patient"] = patient

    return jsonify(response), 200
