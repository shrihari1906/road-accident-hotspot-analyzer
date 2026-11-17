from datetime import date, datetime, time
from utils.db import get_connection


def get_accidents():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM accidents
        ORDER BY accident_date DESC
    """)

    accidents = cursor.fetchall()

    # Convert date/time objects to strings
    for accident in accidents:
        for key, value in accident.items():
            if isinstance(value, (date, datetime, time)):
                accident[key] = value.isoformat()

    cursor.close()
    connection.close()

    return accidents

def get_accident_locations():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            latitude,
            longitude,
            severity,
            city
        FROM accidents;
    """)

    locations = cursor.fetchall()

    cursor.close()
    connection.close()

    return locations


def get_dashboard_stats():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) AS total_accidents,
            COUNT(*) FILTER (WHERE severity = 'Fatal') AS fatal_accidents,
            COUNT(*) FILTER (WHERE severity = 'High') AS high_accidents,
            COUNT(*) FILTER (WHERE severity = 'Medium') AS medium_accidents,
            COUNT(*) FILTER (WHERE severity = 'Low') AS low_accidents
        FROM accidents;
    """)

    stats = cursor.fetchone()

    cursor.close()
    connection.close()

    return stats

def get_hotspots():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            city,
            AVG(latitude) AS latitude,
            AVG(longitude) AS longitude,
            COUNT(*) AS accident_count
        FROM accidents
        GROUP BY city
        ORDER BY accident_count DESC;
    """)

    hotspots = cursor.fetchall()

    cursor.close()
    connection.close()

    return hotspots


from math import radians, sin, cos, sqrt, atan2


def calculate_route_risk(route_coordinates):
    """
    Calculate route safety based on nearby accident locations
    and their severity.

    route_coordinates format:
    [
        [longitude, latitude],
        [longitude, latitude],
        ...
    ]
    """

    accident_locations = get_accident_locations()

    nearby_accidents = []

    # Accident within 1 km of the route
    RISK_DISTANCE_KM = 1.0

    # --------------------------------------------------
    # Bounding-box pre-filter: discard accidents that are
    # more than ~1.5° away from the route's bounding box
    # in either axis before running the expensive Haversine
    # loop. 1° ≈ 111 km, so 0.015° ≈ 1.65 km — slightly
    # wider than RISK_DISTANCE_KM to avoid false negatives.
    # --------------------------------------------------
    BBOX_PAD = 0.015

    route_lats = [float(c[1]) for c in route_coordinates]
    route_lons = [float(c[0]) for c in route_coordinates]

    min_lat = min(route_lats) - BBOX_PAD
    max_lat = max(route_lats) + BBOX_PAD
    min_lon = min(route_lons) - BBOX_PAD
    max_lon = max(route_lons) + BBOX_PAD

    candidate_accidents = [
        a for a in accident_locations
        if min_lat <= float(a["latitude"]) <= max_lat
        and min_lon <= float(a["longitude"]) <= max_lon
    ]

    for accident in candidate_accidents:

        accident_lat = float(accident["latitude"])
        accident_lon = float(accident["longitude"])

        closest_distance = float("inf")

        for coordinate in route_coordinates:

            route_lon = float(coordinate[0])
            route_lat = float(coordinate[1])

            # Convert coordinates to radians
            lat1 = radians(accident_lat)
            lon1 = radians(accident_lon)

            lat2 = radians(route_lat)
            lon2 = radians(route_lon)

            dlat = lat2 - lat1
            dlon = lon2 - lon1

            # Haversine formula
            a = (
                sin(dlat / 2) ** 2
                + cos(lat1)
                * cos(lat2)
                * sin(dlon / 2) ** 2
            )

            c = 2 * atan2(
                sqrt(a),
                sqrt(1 - a)
            )

            distance = 6371 * c

            if distance < closest_distance:
                closest_distance = distance

        # Accident is close to the route
        if closest_distance <= RISK_DISTANCE_KM:
            nearby_accidents.append(accident)

    # ------------------------------------------------
    # Count accident severity
    # ------------------------------------------------

    low_count = 0
    medium_count = 0
    high_count = 0
    fatal_count = 0

    for accident in nearby_accidents:

        severity = str(
            accident.get("severity", "")
        ).strip().lower()

        if severity == "low":
            low_count += 1

        elif severity == "medium":
            medium_count += 1

        elif severity == "high":
            high_count += 1

        elif severity == "fatal":
            fatal_count += 1

    nearby_count = len(nearby_accidents)

    # ------------------------------------------------
    # Determine risk level
    # ------------------------------------------------

    if nearby_count == 0:

        risk = "Low"

        recommendation = (
            "This route has no recorded accident "
            "locations nearby."
        )

    elif fatal_count > 0 or high_count >= 3:

        risk = "High"

        recommendation = (
            "This route passes near serious accident "
            "locations. Consider an alternate route "
            "if possible."
        )

    elif high_count > 0 or medium_count >= 3:

        risk = "Medium"

        recommendation = (
            "Travel carefully because this route passes "
            "near several accident-prone locations."
        )

    else:

        risk = "Low"

        recommendation = (
            "This route has relatively few nearby "
            "accident locations."
        )

    return {
        "nearby_accidents": nearby_count,
        "risk": risk,
        "recommendation": recommendation,
    }