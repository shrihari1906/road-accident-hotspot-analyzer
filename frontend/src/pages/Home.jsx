import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/navbar";
import { getAccidents } from "../services/api";
import "../styles/Home.css";

function Home() {
  const [stats, setStats] = useState({
    total: 0,
    highSeverity: 0,
    cities: 0,
    rainy: 0,
    loaded: false,
  });

  // Pull the same live dataset the Dashboard uses, so the numbers on this
  // page are real and current, not hardcoded marketing copy.
  useEffect(() => {
    getAccidents()
      .then((data) => {
        setStats({
          total: data.length,
          highSeverity: data.filter((a) => a.severity === "High").length,
          cities: new Set(data.map((a) => a.city)).size,
          rainy: data.filter((a) => a.weather_condition === "Rainy").length,
          loaded: true,
        });
      })
      .catch((error) => console.error(error));
  }, []);

  const tickerItems = [
    { label: "Records tracked", value: stats.total },
    { label: "High severity", value: stats.highSeverity },
    { label: "Cities covered", value: stats.cities },
    { label: "Rainy-weather incidents", value: stats.rainy },
  ];

  return (
    <>
      <Navbar />

      <div className="home">
        {/* ================= HERO ================= */}
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="home-eyebrow">
              <span className="home-eyebrow-dot" />
              Karnataka · Live &amp; historical accident data
            </span>

            <h1 className="home-headline">
              See where the roads
              <br />
              turn dangerous —
              <br />
              <span className="home-headline-accent">before you get there.</span>
            </h1>

            <p className="home-subhead">
              We map thousands of accident records across Karnataka, watch for
              live incidents, and route you around the riskiest stretches —
              not just the shortest ones.
            </p>

            <div className="home-cta-row">
              <Link to="/safe-route" className="home-btn home-btn-primary">
                Plan a safer route
              </Link>
              <Link to="/dashboard" className="home-btn home-btn-ghost">
                Explore the data
              </Link>
            </div>
          </div>

          <div className="home-hero-art" aria-hidden="true">
            <svg
              viewBox="0 0 480 400"
              className="home-route-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* faint background grid — map-grid texture */}
              <g className="home-grid" stroke="#2E323D" strokeWidth="1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="400" />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 60} x2="480" y2={i * 60} />
                ))}
              </g>

              {/* the route line, drawn on loop */}
              <path
                id="home-route-path"
                className="home-route-path"
                d="M 60 340 C 140 340, 120 220, 200 220 S 300 120, 360 120 S 420 60, 430 40"
                fill="none"
                stroke="#1976D2"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="10 10"
              />

              {/* hotspot pulses along the way */}
              <g className="home-hotspot" transform="translate(200 220)">
                <circle className="home-pulse-ring" r="6" fill="none" stroke="#FF5722" strokeWidth="2" />
                <circle r="5" fill="#FF5722" />
              </g>
              <g className="home-hotspot home-hotspot-delay" transform="translate(320 150)">
                <circle className="home-pulse-ring" r="6" fill="none" stroke="#FF5722" strokeWidth="2" />
                <circle r="5" fill="#FF5722" />
              </g>

              {/* source marker */}
              <circle cx="60" cy="340" r="7" fill="#14161B" stroke="#1976D2" strokeWidth="3" />

              {/* destination pin */}
              <path
                d="M430 20c-8 0-14 6-14 14 0 10 14 24 14 24s14-14 14-24c0-8-6-14-14-14z"
                fill="#1565C0"
                stroke="#F3F5F8"
                strokeWidth="1.5"
              />

              {/* traveling marker along the path */}
              <circle r="6" fill="#FFB020" className="home-traveler">
                <animateMotion
                  dur="4.5s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath href="#home-route-path" />
                </animateMotion>
              </circle>
            </svg>
          </div>
        </section>

        {/* ================= LIVE STATS TICKER ================= */}
        <section className="home-ticker" aria-label="Live dataset statistics">
          <div className="home-ticker-track">
            {[...tickerItems, ...tickerItems, ...tickerItems].map(
              (item, index) => (
                <span className="home-ticker-item" key={index}>
                  <span className="home-ticker-value">
                    {stats.loaded ? item.value : "—"}
                  </span>
                  <span className="home-ticker-label">{item.label}</span>
                </span>
              )
            )}
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="home-features">
          <h2 className="home-section-heading">Three ways in</h2>

          <div className="home-feature-grid">
            <Link to="/dashboard" className="home-feature-card">
              <span className="home-feature-icon">📊</span>
              <h3>Dashboard</h3>
              <p>
                Severity, weather, and monthly trends across every recorded
                accident — filterable, at a glance.
              </p>
              <span className="home-feature-link">Open dashboard →</span>
            </Link>

            <Link to="/map" className="home-feature-card">
              <span className="home-feature-icon">🗺️</span>
              <h3>Hotspots</h3>
              <p>
                Where accidents cluster most — historical patterns plus live
                incidents updating in real time.
              </p>
              <span className="home-feature-link">View the map →</span>
            </Link>

            <Link to="/safe-route" className="home-feature-card">
              <span className="home-feature-icon">🛣️</span>
              <h3>Safe Route</h3>
              <p>
                Get directions — and if your route runs through a high-risk
                stretch, a safer alternative on request.
              </p>
              <span className="home-feature-link">Plan a route →</span>
            </Link>
          </div>
        </section>

        {/* ================= CLOSING CTA ================= */}
        <section className="home-closing">
          <h2>Know before you go.</h2>
          <Link to="/safe-route" className="home-btn home-btn-primary">
            Plan a safer route
          </Link>
          <p className="home-closing-note">
            Historical data from recorded incidents across Karnataka · live
            accident feed via TomTom, updated every ~1 min
          </p>
        </section>
      </div>
    </>
  );
}

export default Home;
