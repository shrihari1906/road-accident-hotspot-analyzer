// --------------------------------------------------
// Haversine distance between two lat/lon points, in meters
// --------------------------------------------------

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// --------------------------------------------------
// Find the closest point on the route line to the user's current position.
// routeCoords: array of [lon, lat] (OSRM/GeoJSON order)
// Returns { distance, index } — distance in meters, index of nearest coord
// --------------------------------------------------

export function nearestPointOnRoute(userLat, userLon, routeCoords) {
  let minDistance = Infinity;
  let minIndex = 0;

  for (let i = 0; i < routeCoords.length; i++) {
    const [lon, lat] = routeCoords[i];
    const d = distanceMeters(userLat, userLon, lat, lon);

    if (d < minDistance) {
      minDistance = d;
      minIndex = i;
    }
  }

  return { distance: minDistance, index: minIndex };
}

// --------------------------------------------------
// Calculate the compass bearing (0-360°, 0 = North) from one
// GPS point to another. Used to rotate the live nav marker to
// match the direction of travel, like Google Maps does.
// --------------------------------------------------

export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

// --------------------------------------------------
// Convert an OSRM maneuver into a human-readable instruction
// --------------------------------------------------

export function getInstructionText(step) {
  const { maneuver, name } = step;
  const streetName = name && name.trim() !== "" ? ` onto ${name}` : "";

  switch (maneuver.type) {
    case "depart":
      return `Head out${streetName}`;
    case "arrive":
      return "You have arrived at your destination";
    case "roundabout":
    case "rotary":
      return `Take the roundabout${streetName}`;
    case "turn":
    case "end of road":
    case "fork":
      if (maneuver.modifier?.includes("left")) return `Turn left${streetName}`;
      if (maneuver.modifier?.includes("right")) return `Turn right${streetName}`;
      if (maneuver.modifier === "straight") return `Continue straight${streetName}`;
      return `Continue${streetName}`;
    case "merge":
      return `Merge${streetName}`;
    case "on ramp":
      return `Take the ramp${streetName}`;
    case "off ramp":
      return `Take the exit${streetName}`;
    case "continue":
      return `Continue${streetName}`;
    default:
      return `Continue${streetName}`;
  }
}
