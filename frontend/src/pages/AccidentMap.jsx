import { useEffect, useState } from "react";

import Navbar from "../components/navbar";
import HotspotInsights from "../components/HotspotInsights";
import MapView from "../components/mapview";
import { getAccidents } from "../services/api";
import "../styles/Hotspots.css";

function AccidentMap() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [weatherFilter, setWeatherFilter] = useState("All Weather");

  // This page is independent from Dashboard now (separate route), so it
  // fetches its own accident data rather than relying on props from a parent.
  useEffect(() => {
    getAccidents()
      .then((data) => {
        setAccidents(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  // Derive filter options from data
  const cities = ["All Cities", ...new Set(accidents.map((a) => a.city))];
  const severities = ["All Severity", ...new Set(accidents.map((a) => a.severity))];
  const weathers = ["All Weather", ...new Set(accidents.map((a) => a.weather_condition))];

  // Apply filters
  const filteredAccidents = accidents.filter((a) => {
    if (cityFilter !== "All Cities" && a.city !== cityFilter) return false;
    if (severityFilter !== "All Severity" && a.severity !== severityFilter) return false;
    if (weatherFilter !== "All Weather" && a.weather_condition !== weatherFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="hotspots">
          <div className="hotspots-skeleton">
            <div className="hotspots-skeleton-filters">
              {[1, 2, 3].map((i) => (
                <div key={i} className="hotspots-skeleton-filter" />
              ))}
            </div>
            <div className="hotspots-skeleton-insights">
              <div className="hotspots-skeleton-danger" />
              <div className="hotspots-skeleton-chart" />
            </div>
            <div className="hotspots-skeleton-map" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="hotspots">

        {/* ================= HEADER ================= */}
        <div className="hotspots-header">
          <div className="hotspots-header-top">
            <div className="hotspots-header-copy">
              <h1>Accident Hotspots</h1>
              <p>Explore accident clusters, dangerous stretches, and live incidents across Karnataka</p>
            </div>
            <div className="hotspots-status">
              <span className="hotspots-status-dot" />
              Live · {accidents.length} records
            </div>
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="hotspots-filters">
          <select
            className="hotspots-filter-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {cities.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="hotspots-filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            {severities.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="hotspots-filter-select"
            value={weatherFilter}
            onChange={(e) => setWeatherFilter(e.target.value)}
          >
            {weathers.map((w, i) => (
              <option key={i} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* ================= INSIGHTS ================= */}
        <HotspotInsights accidents={filteredAccidents} />

        {/* ================= MAP ================= */}
        {/* No route/journey props here — this page just shows accident
            hotspots on the map, not the route planner. MapView already
            handles route/userPosition/journeyActive being undefined. */}
        <MapView useDarkWrapper={true} />

      </div>
    </>
  );
}

export default AccidentMap;
