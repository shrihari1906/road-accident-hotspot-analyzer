import { useEffect, useMemo, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { getHotspots } from "../services/api";

import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Source marker — Google Maps-style filled circle in BLUE
const sourceIcon = L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"
           style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35));">
        <circle cx="14" cy="14" r="12" fill="#4285F4" stroke="white" stroke-width="3"/>
        <circle cx="14" cy="14" r="4.5" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
  tooltipAnchor: [0, -16],
});

// Destination marker — Google Maps-style filled circle in RED
const destinationIcon = L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"
           style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35));">
        <circle cx="14" cy="14" r="12" fill="#EA4335" stroke="white" stroke-width="3"/>
        <circle cx="14" cy="14" r="4.5" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
  tooltipAnchor: [0, -16],
});

// Live incident marker — orange, with a subtle pulse, so it reads
// distinctly different from the historical hotspot pins (default red)
// and the destination pin (blue teardrop). This represents a real-time
// accident/incident from TomTom's Traffic Incidents API, not your
// seeded historical dataset.
const liveIncidentIcon = L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 26px; height: 26px;">
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(255, 87, 34, 0.35);
        animation: liveIncidentPulse 1.6s ease-out infinite;
      "></div>
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" style="position: relative;">
        <circle cx="13" cy="13" r="10" fill="#FF5722" stroke="white" stroke-width="2" />
        <text x="13" y="18" font-size="14" text-anchor="middle" fill="white" font-weight="bold">!</text>
      </svg>
    </div>
    <style>
      @keyframes liveIncidentPulse {
        0%   { transform: scale(0.6); opacity: 0.9; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// "You are here" marker — pulsing blue circle, distinct from the teardrop
// source/destination pins. Heading arrow shows direction of travel.
function createUserIcon(heading = 0) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <!-- outer pulse ring -->
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(25, 118, 210, 0.18);
          animation: userPulse 2s ease-out infinite;
        "></div>
        <!-- heading arrow -->
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"
             style="position: absolute; top: 0; left: 0; transform: rotate(${heading}deg); transform-origin: 50% 50%; transition: transform 0.3s linear;">
          <polygon points="20,6 25,16 20,13 15,16" fill="#1565C0" stroke="white" stroke-width="1" opacity="0.9"/>
        </svg>
        <!-- solid blue dot -->
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0;">
          <circle cx="20" cy="20" r="8" fill="#1976D2" stroke="white" stroke-width="3" filter="url(#userShadow)"/>
          <defs><filter id="userShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.3"/></filter></defs>
        </svg>
      </div>
      <style>
        @keyframes userPulse {
          0%   { transform: scale(0.7); opacity: 0.7; }
          100% { transform: scale(2.0); opacity: 0; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -20],
  });
}

// Must be rendered INSIDE <MapContainer> — useMap() only works there.
// Handles the two "Google Maps-like" behaviors:
//   1. Zoom out to fit the whole route the moment Start Journey is pressed
//   2. Gently re-center (pan, not zoom) on the live position while journeying
function MapController({ route, journeyActive, userPosition }) {
  const map = useMap();
  const hasFitForThisJourney = useRef(false);

  // Fit the entire route into view once, right when the journey starts
  useEffect(() => {
    if (journeyActive && route?.geometry?.coordinates && !hasFitForThisJourney.current) {
      const bounds = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFitForThisJourney.current = true;
    }

    // Reset so the next journey also gets its own fit-to-route zoom
    if (!journeyActive) {
      hasFitForThisJourney.current = false;
    }
  }, [journeyActive, route, map]);

  // Keep the live "you are here" marker centered as it moves,
  // without changing the zoom level (matches nav-mode behavior)
  useEffect(() => {
    if (journeyActive && userPosition) {
      map.panTo([userPosition.lat, userPosition.lon], { animate: true });
    }
  }, [userPosition, journeyActive, map]);

  return null;
}

function MapView({ route, userPosition, journeyActive, useDarkWrapper = false, hideHotspots = false }) {
  const [hotspots, setHotspots] = useState([]);
  const [liveIncidents, setLiveIncidents] = useState([]);
  const [liveIncidentsError, setLiveIncidentsError] = useState(null);

  // Rebuild the rotated arrow icon only when heading actually changes,
  // not on every render
  const userIcon = useMemo(
    () => createUserIcon(userPosition?.heading ?? 0),
    [userPosition?.heading]
  );

  useEffect(() => {
    if (hideHotspots) return;
    getHotspots()
      .then((data) => setHotspots(data))
      .catch((error) => console.error(error));
  }, [hideHotspots]);

  // --------------------------------------------------
  // Live accident incidents from TomTom Traffic Incidents API.
  // Bounding box currently covers greater Bengaluru — widen this
  // (e.g. to all of Karnataka) if you want broader coverage, but note
  // a bigger box on a free-tier key returns more results per call,
  // which eats into your daily quota faster.
  // --------------------------------------------------

  const BENGALURU_BBOX = "77.35,12.75,77.85,13.15"; // minLon,minLat,maxLon,maxLat

  useEffect(() => {
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

    if (!apiKey) {
      console.warn(
        "VITE_TOMTOM_API_KEY is not set — live accident incidents layer is disabled."
      );
      return;
    }

    if (hideHotspots) return;

    let cancelled = false;

    const fetchLiveIncidents = async () => {
      try {
        const response = await fetch(
          `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${BENGALURU_BBOX}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,events{description}}}}&language=en-GB&categoryFilter=Accident&timeValidityFilter=present`
        );

        if (!response.ok) {
          throw new Error(`TomTom API returned ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setLiveIncidents(data.incidents || []);
          setLiveIncidentsError(null);
        }
      } catch (error) {
        console.error("Live incidents fetch error:", error);
        if (!cancelled) {
          setLiveIncidentsError(
            "Unable to load live accident data right now."
          );
        }
      }
    };

    fetchLiveIncidents();

    // Refresh periodically rather than on every render — TomTom updates
    // its incident data roughly every minute, so polling faster than
    // that wastes API quota for no benefit.
    const intervalId = setInterval(fetchLiveIncidents, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Determine if we should use the dark-styled wrapper or the legacy one
  const wrapperClass = useDarkWrapper ? "hotspots-map-section" : "container mt-4";

  return (
    <div className={wrapperClass}>

      {useDarkWrapper ? (
        <>
          <h3 className="hotspots-map-title">
            <span>🗺️</span> Accident Hotspot Map
          </h3>

          {/* Dark-themed legend pills */}
          <div className="hotspots-map-legend">
            <span className="hotspots-legend-pill">
              <span className="hotspots-legend-dot hotspots-legend-dot--historical" />
              Historical hotspot (seeded data)
            </span>
            <span className="hotspots-legend-pill">
              <span className="hotspots-legend-dot hotspots-legend-dot--live" />
              Live accident (TomTom, ~1 min refresh)
            </span>
          </div>

          {liveIncidentsError && (
            <div className="hotspots-map-error">
              ⚠️ {liveIncidentsError}
            </div>
          )}
        </>
      ) : (
        <>
          <h3>🗺️ Accident Hotspots</h3>

          {/* Legacy Bootstrap legend */}
          <div className="d-flex gap-4 align-items-center mb-2 flex-wrap">
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#3388ff",
                  marginRight: 6,
                }}
              ></span>
              Historical hotspot (seeded data)
            </span>

            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#FF5722",
                  marginRight: 6,
                }}
              ></span>
              Live accident (TomTom, updates every ~1 min)
            </span>
          </div>

          {liveIncidentsError && (
            <div className="alert alert-warning py-1 px-2 small mb-2">
              {liveIncidentsError}
            </div>
          )}
        </>
      )}

      <div className={useDarkWrapper ? "hotspots-map-container" : ""}>
        <MapContainer
          center={[15.3173, 75.7139]}
          zoom={7}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            route={route}
            journeyActive={journeyActive}
            userPosition={userPosition}
          />

          {/* Hotspot Markers (historical, seeded dataset) — hidden on Safe Route page */}
          {!hideHotspots && hotspots.map((spot, index) => (
            <Marker
              key={index}
              position={[Number(spot.latitude), Number(spot.longitude)]}
            >
              <Popup>
                <strong>{spot.city}</strong>
                <br />
                Accident Count: {spot.accident_count}
              </Popup>
            </Marker>
          ))}

          {/* Live incident markers (TomTom, real-time) — hidden on Safe Route page */}
          {!hideHotspots && liveIncidents.map((incident, index) => {
            const coords = incident.geometry?.coordinates;
            if (!coords) return null;

            const [lon, lat] = Array.isArray(coords[0])
              ? coords[0]
              : coords;

            const description =
              incident.properties?.events?.[0]?.description ||
              "Accident reported";

            return (
              <Marker
                key={`live-${index}`}
                position={[lat, lon]}
                icon={liveIncidentIcon}
              >
                <Popup>
                  <strong>🚨 Live Accident</strong>
                  <br />
                  {description}
                </Popup>
              </Marker>
            );
          })}

          {/* Route */}
          {route && (
            <>
              <Polyline
                positions={route.geometry.coordinates.map((coord) => [
                  coord[1],
                  coord[0],
                ])}
                pathOptions={{
                  color: "#1976d2",
                  weight: 5,
                  opacity: 0.9,
                }}
              />

              {/* Source marker — hidden during active journey (replaced by live user marker) */}
              {!journeyActive && (() => {
                const coords = route.geometry.coordinates;
                const [srcLon, srcLat] = coords[0];
                return (
                  <Marker position={[srcLat, srcLon]} icon={sourceIcon} zIndexOffset={1000}>
                    <Tooltip direction="top" offset={[0, -6]} permanent={false}>
                      📍 Source
                    </Tooltip>
                    <Popup>Source — Starting Point</Popup>
                  </Marker>
                );
              })()}

              {/* Destination marker — last coordinate of the route */}
              {(() => {
                const coords = route.geometry.coordinates;
                const [destLon, destLat] = coords[coords.length - 1];
                return (
                  <Marker position={[destLat, destLon]} icon={destinationIcon} zIndexOffset={1000}>
                    <Tooltip direction="top" offset={[0, -6]} permanent={false}>
                      🏁 Destination
                    </Tooltip>
                    <Popup>Destination — End Point</Popup>
                  </Marker>
                );
              })()}
            </>
          )}

          {/* Live "you are here" marker during an active journey */}
          {userPosition && (
            <Marker
              position={[userPosition.lat, userPosition.lon]}
              icon={userIcon}
            >
              <Tooltip direction="top" offset={[0, -6]} permanent={false}>
                📌 Your Location
              </Tooltip>
              <Popup>You are here</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
