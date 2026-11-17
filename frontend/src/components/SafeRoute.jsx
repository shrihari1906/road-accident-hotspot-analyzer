import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  distanceMeters,
  nearestPointOnRoute,
  getInstructionText,
  calculateBearing,
} from "../utils/geo";
import { getRouteRisk } from "../services/api";

// How far (meters) the user can drift from the route line before
// we consider them "off route" and trigger a reroute
const OFF_ROUTE_THRESHOLD = 60;

// How close (meters) the user needs to be to a step's maneuver point
// before we advance to the next instruction
const STEP_ADVANCE_THRESHOLD = 30;

function SafeRoute({ setRoute, setUserPosition, journeyActive, setJourneyActive }) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const [sourceCoordinates, setSourceCoordinates] = useState(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState(null);

  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [directionSteps, setDirectionSteps] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState(null);

  const [nearbyAccidents, setNearbyAccidents] = useState(null);
  const [risk, setRisk] = useState(null);
  const [recommendation, setRecommendation] = useState("");

  // Holds { route, riskData } for a genuinely safer alternative OSRM found,
  // only populated when the primary route comes back High risk
  const [saferAlternative, setSaferAlternative] = useState(null);
  const [checkingAlternatives, setCheckingAlternatives] = useState(false);

  const [loading, setLoading] = useState(false);

  // ---- Journey (live navigation) state ----
  // journeyActive itself now lives in Dashboard (passed down as a prop) so
  // MapView can react to it too — e.g. auto-zoom to fit the route on start.
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [journeyMessage, setJourneyMessage] = useState("");

  const watchIdRef = useRef(null);
  const sourceControllerRef = useRef(null);
  const destinationControllerRef = useRef(null);
  // Tracks the previous GPS point + heading so we can compute bearing
  // when the device doesn't report coords.heading directly (e.g. desktop
  // browsers, or GPS chips that only give heading while actively moving)
  const lastPositionRef = useRef(null);

  const BIAS_LAT = 12.9716;
  const BIAS_LON = 77.5946;

  // --------------------------------------------------
  // Search location using Photon (Komoot)
  // --------------------------------------------------

  const searchLocation = async (query, setSuggestions, controllerRef) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await axios.get("https://photon.komoot.io/api/", {
        params: {
          q: trimmedQuery,
          lat: BIAS_LAT,
          lon: BIAS_LON,
          limit: 8,
          lang: "en",
        },
        signal: controller.signal,
      });

      const results = (response.data.features || []).filter((place) => {
        const code = (place.properties?.countrycode || "").toUpperCase();
        const country = place.properties?.country || "";
        return code === "IN" || country.toLowerCase() === "india" || !code;
      });

      setSuggestions(results.length > 0 ? results : response.data.features || []);
    } catch (error) {
      if (axios.isCancel(error) || error.name === "CanceledError") return;
      console.error("Location search error:", error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (source.trim().length < 2) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => setSourceSuggestions([]), 0);
      return () => clearTimeout(timer);
    }
    // Only search if we don't have coordinates (user is typing, not selected)
    if (sourceCoordinates) return;

    const timer = setTimeout(() => {
      searchLocation(source, setSourceSuggestions, sourceControllerRef);
    }, 300);
    return () => clearTimeout(timer);
  }, [source, sourceCoordinates]);

  useEffect(() => {
    if (destination.trim().length < 2) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => setDestinationSuggestions([]), 0);
      return () => clearTimeout(timer);
    }
    // Only search if we don't have coordinates (user is typing, not selected)
    if (destinationCoordinates) return;

    const timer = setTimeout(() => {
      searchLocation(
        destination,
        setDestinationSuggestions,
        destinationControllerRef
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [destination, destinationCoordinates]);

  const getLocationName = (place) => {
    const p = place.properties;
    return p.name || p.city || p.district || p.county || p.state || "Unknown location";
  };

  const getLocationDetails = (place) => {
    const p = place.properties;
    const parts = [p.city || p.district || p.county, p.state, "India"];
    return [...new Set(parts.filter(Boolean))].join(", ");
  };

  const getCoordinates = (place) => ({
    lat: place.geometry.coordinates[1],
    lon: place.geometry.coordinates[0],
  });

  const handleSourceSelect = (place) => {
    setSource(getLocationName(place));
    setSourceCoordinates(getCoordinates(place));
    setSourceSuggestions([]);
  };

  const handleDestinationSelect = (place) => {
    setDestination(getLocationName(place));
    setDestinationCoordinates(getCoordinates(place));
    setDestinationSuggestions([]);
  };

  // --------------------------------------------------
  // Fetch a route from OSRM (used for initial search AND rerouting)
  // --------------------------------------------------

  const fetchRoute = async (fromLat, fromLon, toLat, toLon) => {
    const routeResponse = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}`,
      {
        params: {
          overview: "full",
          geometries: "geojson",
          steps: true,
        },
      }
    );

    if (!routeResponse.data.routes || routeResponse.data.routes.length === 0) {
      throw new Error("No route found");
    }

    return routeResponse.data.routes[0];
  };

  // Lower number = safer. Anything unrecognized sorts last.
  const riskRank = { Low: 1, Medium: 2, High: 3 };

  const [noSaferAltMessage, setNoSaferAltMessage] = useState("");

  // --------------------------------------------------
  // When the primary route comes back High risk, check OSRM's alternative
  // routes and see if any of them are actually safer — rather than just
  // telling the user "consider an alternate route" and leaving them to
  // find one themselves.
  // --------------------------------------------------

  const checkForSaferAlternative = async (
    fromLat,
    fromLon,
    toLat,
    toLon,
    primaryRiskRank
  ) => {
    setCheckingAlternatives(true);
    setNoSaferAltMessage("");

    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}`,
        {
          params: {
            overview: "full",
            geometries: "geojson",
            steps: true,
            alternatives: true,
          },
        }
      );

      const candidateRoutes = (response.data.routes || []).slice(1); // skip index 0, that's the primary route we already have

      if (candidateRoutes.length === 0) {
        setSaferAlternative(null);
        setNoSaferAltMessage("No alternative routes found between these locations.");
        return;
      }

      // Evaluate risk for every candidate in parallel
      const evaluated = await Promise.all(
        candidateRoutes.map(async (candidateRoute) => {
          try {
            const riskData = await getRouteRisk(
              candidateRoute.geometry.coordinates
            );
            return { route: candidateRoute, riskData };
          } catch {
            return null;
          }
        })
      );

      const validCandidates = evaluated.filter(Boolean);

      // Pick the candidate with the best (lowest) risk rank. If there's a tie,
      // prefer fewer nearby accidents or shorter distance.
      const best = validCandidates.reduce((bestSoFar, current) => {
        if (!bestSoFar) return current;

        const currentRank = riskRank[current.riskData.risk] ?? 4;
        const bestRank = riskRank[bestSoFar.riskData.risk] ?? 4;

        if (currentRank < bestRank) return current;
        if (currentRank === bestRank) {
          if (current.riskData.nearby_accidents < bestSoFar.riskData.nearby_accidents) return current;
          if (
            current.riskData.nearby_accidents === bestSoFar.riskData.nearby_accidents &&
            current.route.distance < bestSoFar.route.distance
          ) {
            return current;
          }
        }
        return bestSoFar;
      }, null);

      const isSafer =
        best &&
        ((riskRank[best.riskData.risk] ?? 4) < primaryRiskRank ||
          (best.riskData.nearby_accidents !== null &&
            nearbyAccidents !== null &&
            best.riskData.nearby_accidents < nearbyAccidents));

      if (isSafer) {
        setSaferAlternative(best);
        setNoSaferAltMessage("");
      } else {
        setSaferAlternative(null);
        setNoSaferAltMessage(
          "Evaluated alternative routes — all available paths carry similar risk. Drive with caution!"
        );
      }
    } catch (error) {
      console.error("Alternate route check failed:", error);
      setSaferAlternative(null);
      setNoSaferAltMessage("Unable to check alternate routes at this time.");
    } finally {
      setCheckingAlternatives(false);
    }
  };

  // Swap the currently displayed route for the safer alternative the
  // user chose to accept
  const useSaferAlternative = () => {
    if (!saferAlternative) return;

    const { route: altRoute, riskData } = saferAlternative;

    setRoute(altRoute);
    setRouteGeometry(altRoute.geometry.coordinates);
    setDistance(altRoute.distance);
    setDuration(altRoute.duration);
    setDirectionSteps(altRoute.legs?.[0]?.steps || []);
    setNearbyAccidents(riskData.nearby_accidents);
    setRisk(riskData.risk);
    setRecommendation(riskData.recommendation);
    setSaferAlternative(null);
  };

  // --------------------------------------------------
  // Find Route (initial search)
  // --------------------------------------------------

  const handleFindRoute = async () => {
    if (!sourceCoordinates || !destinationCoordinates) {
      alert("Please select both Source and Destination from the suggestions.");
      return;
    }

    try {
      setLoading(true);

      setDistance(null);
      setDuration(null);
      setDirectionSteps([]);
      setNearbyAccidents(null);
      setRisk(null);
      setRecommendation("");
      setSaferAlternative(null);
      setNoSaferAltMessage("");

      const route = await fetchRoute(
        sourceCoordinates.lat,
        sourceCoordinates.lon,
        destinationCoordinates.lat,
        destinationCoordinates.lon
      );

      setRoute(route);
      setRouteGeometry(route.geometry.coordinates);
      setDistance(route.distance);
      setDuration(route.duration);
      setDirectionSteps(route.legs?.[0]?.steps || []);

      const riskData = await getRouteRisk(route.geometry.coordinates);

      setNearbyAccidents(riskData.nearby_accidents);
      setRisk(riskData.risk);
      setRecommendation(riskData.recommendation);
    } catch (error) {
      console.error("Route generation/risk analysis error:", error);
      alert("Unable to generate the route or calculate route risk.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Voice narration
  // --------------------------------------------------

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  // --------------------------------------------------
  // Start Journey — live tracking
  // --------------------------------------------------

  const startJourney = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    if (!routeGeometry || directionSteps.length === 0) {
      alert("Please find a route first.");
      return;
    }

    setJourneyActive(true);
    setCurrentStepIndex(0);
    speak(getInstructionText(directionSteps[0]));
    setJourneyMessage(getInstructionText(directionSteps[0]));

    // Reset bearing tracking for this journey
    lastPositionRef.current = null;

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        // Prefer the device's own GPS heading (accurate, available on most
        // phones while moving). Fall back to calculating bearing from the
        // last known point — needed on desktop browsers or when the GPS
        // chip doesn't report heading (e.g. standing still).
        let heading = pos.coords.heading;
        const headingIsValid =
          heading !== null && heading !== undefined && !Number.isNaN(heading);

        if (!headingIsValid) {
          if (lastPositionRef.current) {
            const movedDistance = distanceMeters(
              lastPositionRef.current.lat,
              lastPositionRef.current.lon,
              userLat,
              userLon
            );

            // Only recompute bearing if we've actually moved a meaningful
            // distance — otherwise GPS jitter makes the arrow spin randomly
            // while the user is stationary.
            heading =
              movedDistance > 3
                ? calculateBearing(
                  lastPositionRef.current.lat,
                  lastPositionRef.current.lon,
                  userLat,
                  userLon
                )
                : lastPositionRef.current.heading;
          } else {
            heading = 0;
          }
        }

        lastPositionRef.current = { lat: userLat, lon: userLon, heading };

        setUserPosition({ lat: userLat, lon: userLon, heading });

        // Off-route check
        const { distance: distToRoute } = nearestPointOnRoute(
          userLat,
          userLon,
          routeGeometry
        );

        if (distToRoute > OFF_ROUTE_THRESHOLD && destinationCoordinates) {
          try {
            const newRoute = await fetchRoute(
              userLat,
              userLon,
              destinationCoordinates.lat,
              destinationCoordinates.lon
            );

            setRoute(newRoute);
            setRouteGeometry(newRoute.geometry.coordinates);
            setDirectionSteps(newRoute.legs?.[0]?.steps || []);
            setDistance(newRoute.distance);
            setDuration(newRoute.duration);
            setCurrentStepIndex(0);

            const msg = "Rerouting. " + getInstructionText(
              newRoute.legs?.[0]?.steps?.[0] || {}
            );
            setJourneyMessage(msg);
            speak(msg);
          } catch (err) {
            console.error("Reroute failed:", err);
          }
          return;
        }

        // Step advancement check
        setCurrentStepIndex((prevIndex) => {
          const step = directionSteps[prevIndex];
          if (!step) return prevIndex;

          const [manLon, manLat] = step.maneuver.location;
          const distToManeuver = distanceMeters(userLat, userLon, manLat, manLon);

          if (
            distToManeuver < STEP_ADVANCE_THRESHOLD &&
            prevIndex < directionSteps.length - 1
          ) {
            const nextIndex = prevIndex + 1;
            const nextText = getInstructionText(directionSteps[nextIndex]);
            setJourneyMessage(nextText);
            speak(nextText);
            return nextIndex;
          }

          return prevIndex;
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to access your location. Please enable location access.");
        stopJourney();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    watchIdRef.current = id;
  };

  const stopJourney = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setJourneyActive(false);
    setJourneyMessage("");
    setUserPosition(null);
    lastPositionRef.current = null;
  };

  // Stop tracking if component unmounts mid-journey
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const getRiskLevel = () => {
    if (risk === "Low") return "low";
    if (risk === "Medium") return "medium";
    if (risk === "High") return "high";
    return "low";
  };

  const getRiskEmoji = () => {
    if (risk === "Low") return "🟢";
    if (risk === "Medium") return "🟡";
    if (risk === "High") return "🔴";
    return "";
  };

  return (
    <div className="sr-planner">
      <div className="sr-planner-card">

        {/* ================= HEADER ================= */}
        <div className="sr-planner-header">
          <span className="sr-planner-header-icon">🛣️</span>
          <h3>Safe Route Planner</h3>
        </div>

        <div className="sr-planner-body">

          {/* ================= INPUTS ================= */}
          <div className="sr-input-row">

            {/* Source */}
            <div className="sr-input-group">
              <label className="sr-input-label">Source</label>
              <div className="sr-input-wrap">
                <span className="sr-input-icon">📍</span>
                <input
                  type="text"
                  className="sr-input"
                  placeholder="Enter starting point..."
                  value={source}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSource(v);
                    setSourceCoordinates(null);
                  }}
                />
              </div>
              {sourceSuggestions.length > 0 && !sourceCoordinates && (
                <ul className="sr-suggestions">
                  {sourceSuggestions.map((place, index) => (
                    <li
                      key={`${place.properties.osm_id}-${index}`}
                      className="sr-suggestion-item"
                      onClick={() => handleSourceSelect(place)}
                    >
                      <div className="sr-suggestion-name">{getLocationName(place)}</div>
                      <div className="sr-suggestion-detail">{getLocationDetails(place)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Destination */}
            <div className="sr-input-group">
              <label className="sr-input-label">Destination</label>
              <div className="sr-input-wrap">
                <span className="sr-input-icon">🏁</span>
                <input
                  type="text"
                  className="sr-input"
                  placeholder="Enter destination..."
                  value={destination}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDestination(v);
                    setDestinationCoordinates(null);
                  }}
                />
              </div>
              {destinationSuggestions.length > 0 && !destinationCoordinates && (
                <ul className="sr-suggestions">
                  {destinationSuggestions.map((place, index) => (
                    <li
                      key={`${place.properties.osm_id}-${index}`}
                      className="sr-suggestion-item"
                      onClick={() => handleDestinationSelect(place)}
                    >
                      <div className="sr-suggestion-name">{getLocationName(place)}</div>
                      <div className="sr-suggestion-detail">{getLocationDetails(place)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Find Route Button */}
            <button
              className="sr-find-btn"
              onClick={handleFindRoute}
              disabled={!sourceCoordinates || !destinationCoordinates || loading}
            >
              {loading ? "Finding..." : "Find Route"}
            </button>
          </div>

          {/* ================= ROUTE SUMMARY ================= */}
          {distance !== null && duration !== null && (
            <div className="sr-summary">
              <h5 className="sr-summary-title">
                <span>📍</span> Route Summary
              </h5>
              <div className="sr-summary-stats">
                <div className="sr-summary-stat">
                  <span className="sr-summary-stat-label">Distance</span>
                  <span className="sr-summary-stat-value">
                    {(distance / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="sr-summary-stat">
                  <span className="sr-summary-stat-label">Estimated Time</span>
                  <span className="sr-summary-stat-value">
                    {Math.floor(duration / 3600)} hr {Math.floor((duration % 3600) / 60)} min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= RISK ANALYSIS ================= */}
          {risk && !saferAlternative && (
            <div className={`sr-risk sr-risk--${getRiskLevel()}`}>
              <h5 className="sr-risk-title">
                <span>🚨</span> Route Safety Analysis
              </h5>
              <div className="sr-risk-grid">
                <div className="sr-risk-item">
                  <span className="sr-risk-item-label">Nearby Accidents</span>
                  <span className="sr-risk-item-value">{nearbyAccidents}</span>
                </div>
                <div className="sr-risk-item">
                  <span className="sr-risk-item-label">Risk Level</span>
                  <span className={`sr-risk-badge sr-risk-badge--${getRiskLevel()}`}>
                    {getRiskEmoji()} {risk}
                  </span>
                </div>
              </div>
              <p className="sr-risk-recommendation">
                <strong>Recommendation:</strong> {recommendation}
              </p>

              {/* Only offered for High risk routes */}
              {risk === "High" && !checkingAlternatives && (
                <button
                  className="sr-risk-alt-btn"
                  onClick={() =>
                    checkForSaferAlternative(
                      sourceCoordinates.lat,
                      sourceCoordinates.lon,
                      destinationCoordinates.lat,
                      destinationCoordinates.lon,
                      riskRank[risk] ?? 4
                    )
                  }
                >
                  🔍 Find a Safer Route
                </button>
              )}

              {noSaferAltMessage && (
                <div
                  className="sr-no-alt-info"
                  style={{
                    marginTop: "12px",
                    color: "#fbbf24",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(245, 158, 11, 0.12)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <span>ℹ️</span> {noSaferAltMessage}
                </div>
              )}
            </div>
          )}

          {/* ================= CHECKING ALTERNATIVES ================= */}
          {checkingAlternatives && (
            <div className="sr-checking">
              <div className="sr-checking-spinner" />
              Checking for a safer alternate route...
            </div>
          )}

          {/* ================= SAFER ALTERNATIVE ================= */}
          {saferAlternative && (
            <div className="sr-safer">
              <h5 className="sr-safer-title">
                <span>🛡️</span> Safer Route Available
              </h5>
              <p className="sr-safer-desc">
                Your original route was flagged <strong>High risk</strong> —
                we found this alternative with a lower accident risk instead.
              </p>
              <div className="sr-safer-stats">
                <div className="sr-risk-item">
                  <span className="sr-risk-item-label">Distance</span>
                  <span className="sr-risk-item-value">
                    {(saferAlternative.route.distance / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="sr-risk-item">
                  <span className="sr-risk-item-label">Estimated Time</span>
                  <span className="sr-risk-item-value">
                    {Math.floor(saferAlternative.route.duration / 3600)} hr{" "}
                    {Math.floor((saferAlternative.route.duration % 3600) / 60)} min
                  </span>
                </div>
                <div className="sr-risk-item">
                  <span className="sr-risk-item-label">Risk Level</span>
                  <span className={`sr-risk-badge sr-risk-badge--${saferAlternative.riskData.risk.toLowerCase()}`}>
                    {saferAlternative.riskData.risk === "Low" && "🟢"}
                    {saferAlternative.riskData.risk === "Medium" && "🟡"}{" "}
                    {saferAlternative.riskData.risk}
                  </span>
                </div>
                <div className="sr-risk-item">
                  <span className="sr-risk-item-label">Nearby Accidents</span>
                  <span className="sr-risk-item-value">
                    {saferAlternative.riskData.nearby_accidents}
                  </span>
                </div>
              </div>
              <button
                className="sr-safer-use-btn"
                onClick={useSaferAlternative}
              >
                ✅ Use This Route Instead
              </button>
            </div>
          )}

          {/* ================= JOURNEY CONTROLS ================= */}
          {directionSteps.length > 0 && (
            <div className="sr-journey-controls">
              {!journeyActive ? (
                <button className="sr-journey-btn sr-journey-btn--start" onClick={startJourney}>
                  ▶️ Start Journey
                </button>
              ) : (
                <button className="sr-journey-btn sr-journey-btn--stop" onClick={stopJourney}>
                  ⏹️ End Journey
                </button>
              )}
            </div>
          )}

          {/* ================= LIVE JOURNEY BANNER ================= */}
          {journeyActive && journeyMessage && (
            <div className="sr-journey-banner">
              <span className="sr-journey-banner-icon">🧭</span>
              <span className="sr-journey-banner-text">{journeyMessage}</span>
            </div>
          )}

          {/* ================= TURN-BY-TURN DIRECTIONS ================= */}
          {journeyActive && directionSteps.length > 0 && (
            <div className="sr-directions">
              <div className="sr-directions-header">
                <span>📋</span>
                <h5>Turn-by-Turn Directions</h5>
              </div>
              <ul className="sr-directions-list">
                {directionSteps.map((step, index) => (
                  <li
                    key={index}
                    className={`sr-direction-step ${journeyActive && index === currentStepIndex
                        ? "sr-direction-step--active"
                        : ""
                      }`}
                  >
                    <span className="sr-direction-number">{index + 1}</span>
                    <span className="sr-direction-text">
                      {getInstructionText(step)}
                    </span>
                    {step.distance > 0 && (
                      <span className="sr-direction-distance">
                        {(step.distance / 1000).toFixed(2)} km
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default SafeRoute;
