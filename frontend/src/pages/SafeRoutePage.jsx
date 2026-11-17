import { useState } from "react";

import Navbar from "../components/navbar";
import SafeRoute from "../components/SafeRoute";
import MapView from "../components/mapview";
import "../styles/SafeRoute.css";

function SafeRoutePage() {
  // This page owns the route/journey state itself now — SafeRoute and
  // MapView are siblings here (not inside Dashboard anymore), so the
  // state that connects them (route, live position, journey status)
  // has to live at this page level instead.
  const [route, setRoute] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [journeyActive, setJourneyActive] = useState(false);

  return (
    <>
      <Navbar />

      <div className="saferoute">

        {/* ================= HERO ================= */}
        <div className="sr-hero">
          <div className="sr-hero-banner">
            <img
              src="/saferoute-hero.png"
              alt="Safe Route Navigation"
              className="sr-hero-img"
            />
            <div className="sr-hero-overlay">
              <span className="sr-hero-eyebrow">
                <span className="sr-hero-eyebrow-dot" />
                AI-Powered Route Safety
              </span>
              <h1 className="sr-hero-title">Navigate Smarter, Arrive Safer</h1>
              <p className="sr-hero-sub">
                Enter your origin and destination — we'll analyze the route for accident hotspots and suggest safer alternatives
              </p>
            </div>
          </div>
        </div>

        {/* ================= ROUTE PLANNER ================= */}
        <SafeRoute
          setRoute={setRoute}
          setUserPosition={setUserPosition}
          journeyActive={journeyActive}
          setJourneyActive={setJourneyActive}
        />

        {/* Map only appears once a route has actually been found — no point
            showing an empty map before the user has entered Source/Destination */}
        {route && (
          <MapView
            route={route}
            userPosition={userPosition}
            journeyActive={journeyActive}
            useDarkWrapper={true}
            hideHotspots={true}
          />
        )}

      </div>
    </>
  );
}

export default SafeRoutePage;
