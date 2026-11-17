from flask import Flask, jsonify, request
from flask_cors import CORS

from services.accident_service import (
    get_accidents,
    get_dashboard_stats,
    get_hotspots,
    get_accident_locations,
    calculate_route_risk,
)
from services.auth_service import login_user, require_admin

app = Flask(__name__)
CORS(app, supports_credentials=True)


# -------------------------------------------------------
# Auth endpoints
# -------------------------------------------------------

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required."}), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    # Basic presence check before hitting the DB
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    try:
        token, user = login_user(username, password)
    except ValueError as e:
        # Deliberate: same 401 for wrong username OR wrong password
        # so the response doesn't reveal which field was incorrect
        return jsonify({"error": str(e)}), 401

    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
        },
    })


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    # JWT is stateless — logout is handled client-side by dropping the token.
    # This endpoint exists so the frontend has a clean API contract.
    return jsonify({"message": "Logged out."})


@app.route("/api/auth/me", methods=["GET"])
@require_admin
def auth_me():
    """Returns the current user's identity — used by the frontend to verify a stored token is still valid."""
    claims = request.current_user
    return jsonify({
        "id": claims.get("sub"),
        "username": claims.get("username"),
        "role": claims.get("role"),
    })


# -------------------------------------------------------
# Public data endpoints
# -------------------------------------------------------

@app.route("/api/accidents")
def accidents():
    return jsonify(get_accidents())


@app.route("/api/dashboard")
def dashboard():
    return jsonify(get_dashboard_stats())


@app.route("/api/hotspots")
def hotspots():
    return jsonify(get_hotspots())


@app.route("/api/accident-locations")
def accident_locations():
    return jsonify(get_accident_locations())


@app.route("/api/route-risk", methods=["POST"])
def route_risk():
    data = request.get_json()

    if not data or "coordinates" not in data:
        return jsonify({"error": "Route coordinates are required."}), 400

    coordinates = data["coordinates"]

    if not coordinates:
        return jsonify({"error": "Route coordinates cannot be empty."}), 400

    # Validate that every coordinate is a [lon, lat] numeric pair
    try:
        for coord in coordinates:
            if not isinstance(coord, (list, tuple)) or len(coord) < 2:
                raise ValueError("Each coordinate must be a [longitude, latitude] pair.")
            float(coord[0])
            float(coord[1])
    except (TypeError, ValueError) as e:
        return jsonify({"error": f"Invalid coordinate format: {e}"}), 400

    result = calculate_route_risk(coordinates)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)