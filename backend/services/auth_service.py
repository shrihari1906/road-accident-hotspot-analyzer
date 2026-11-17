import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify
from config import Config
from utils.db import get_connection


# JWT access token lifetime
JWT_EXPIRY_HOURS = 8


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of the given password string."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time bcrypt comparison — safe against timing attacks."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str, username: str, role: str) -> str:
    """Issue a signed JWT. Payload carries only non-sensitive identity claims."""
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    return jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])


def login_user(username: str, password: str):
    """
    Validate credentials against the DB.
    Returns (token, user_row) on success, raises ValueError on failure.
    """
    if not username or not password:
        raise ValueError("Username and password are required.")

    # Normalise — prevent trivial bypass via whitespace
    username = username.strip()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, username, password_hash, role FROM users WHERE username = %s",
        (username,)
    )
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    # Use verify_password even when user is None to prevent user-enumeration
    # via timing difference (dummy hash check keeps timing consistent).
    dummy_hash = "$2b$12$invalidhashpaddinginvalidhashpaddinginvalidhashpadding.."
    candidate_hash = user["password_hash"] if user else dummy_hash

    password_ok = verify_password(password, candidate_hash)

    if not user or not password_ok:
        raise ValueError("Invalid username or password.")

    token = create_token(
        str(user["id"]),
        user["username"],
        user["role"]
    )
    return token, dict(user)


# -------------------------------------------------------
# Route decorator — protects endpoints that require a
# valid admin JWT in the Authorization: Bearer <token> header
# -------------------------------------------------------

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required."}), 401

        token = auth_header[7:]  # strip "Bearer "

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401

        if payload.get("role") != "admin":
            return jsonify({"error": "Admin access required."}), 403

        # Attach decoded claims so the route handler can read them if needed
        request.current_user = payload
        return f(*args, **kwargs)

    return decorated
