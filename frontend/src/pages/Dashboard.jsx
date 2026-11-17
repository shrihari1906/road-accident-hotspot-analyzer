import { useEffect, useState } from "react";

import Navbar from "../components/navbar";
import DashboardCards from "../components/Dashboardcards";
import Charts from "../components/charts";
import SearchBar from "../components/searchbar";
import { getAccidents } from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {
  const [accidents, setAccidents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filteredAccidents = accidents.filter((accident) => {
    return (
      accident.city.toLowerCase().includes(search.toLowerCase()) ||
      accident.severity.toLowerCase().includes(search.toLowerCase()) ||
      accident.weather_condition.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Compute hotspot insights
  const cityCount = {};
  filteredAccidents.forEach((a) => {
    cityCount[a.city] = (cityCount[a.city] || 0) + 1;
  });
  const sortedCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]);
  const mostDangerousCity = sortedCities[0];

  // Severity badge helper
  const getSeverityClass = (severity) => {
    return `dash-severity-badge dash-severity-badge--${severity.toLowerCase()}`;
  };

  // Recent accidents (last 10)
  const recentAccidents = [...filteredAccidents]
    .sort((a, b) => new Date(b.accident_date) - new Date(a.accident_date))
    .slice(0, 10);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard">
          <div className="dash-skeleton">
            <div className="dash-skeleton-cards">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="dash-skeleton-card" />
              ))}
            </div>
            <div className="dash-skeleton-charts">
              {[1, 2].map((i) => (
                <div key={i} className="dash-skeleton-chart" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="dashboard">

        {/* ================= HEADER ================= */}
        <div className="dash-header">
          <div className="dash-header-top">
            <div className="dash-header-copy">
              <h1>Analytics Dashboard</h1>
              <p>Real-time accident data across Karnataka — filter, explore, and identify patterns</p>
            </div>
            <div className="dash-status">
              <span className="dash-status-dot" />
              Live data · {accidents.length} records
            </div>
          </div>
        </div>

        {/* ================= SEARCH ================= */}
        <SearchBar search={search} setSearch={setSearch} />

        {/* ================= STAT CARDS ================= */}
        <DashboardCards accidents={filteredAccidents} />

        {/* ================= CHARTS ================= */}
        <Charts accidents={filteredAccidents} />

        {/* ================= HOTSPOT INSIGHTS ================= */}
        {sortedCities.length > 0 && (
          <div className="dash-insights">
            <h3 className="dash-section-title">
              <span>📍</span> Hotspot Insights
            </h3>
            <div className="dash-insights-grid">

              {/* Most Dangerous City */}
              <div className="dash-danger-card">
                <div className="dash-danger-icon">🏆</div>
                <div className="dash-danger-label">Most Dangerous City</div>
                <div className="dash-danger-city">
                  {mostDangerousCity ? mostDangerousCity[0] : "—"}
                </div>
                <div className="dash-danger-count">
                  🚨 {mostDangerousCity ? mostDangerousCity[1] : 0}
                </div>
                <div className="dash-danger-sub">Recorded Accidents</div>
              </div>

              {/* Top Cities Table */}
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>City</th>
                      <th>Accidents</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCities.slice(0, 5).map(([city, count], idx) => (
                      <tr key={city}>
                        <td>#{idx + 1}</td>
                        <td style={{ color: "#f3f5f8", fontWeight: 500 }}>{city}</td>
                        <td>{count}</td>
                        <td style={{ opacity: 0.7 }}>
                          {((count / filteredAccidents.length) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* ================= RECENT ACCIDENTS ================= */}
        {recentAccidents.length > 0 && (
          <div className="dash-recent">
            <h3 className="dash-section-title">
              <span>🕐</span> Recent Accidents
            </h3>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Location</th>
                    <th>City</th>
                    <th>Severity</th>
                    <th>Weather</th>
                    <th>Vehicles</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAccidents.map((accident) => (
                    <tr key={accident.id}>
                      <td>
                        {new Date(accident.accident_date).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </td>
                      <td style={{ color: "#f3f5f8" }}>
                        {accident.location_name}
                      </td>
                      <td>{accident.city}</td>
                      <td>
                        <span className={getSeverityClass(accident.severity)}>
                          {accident.severity}
                        </span>
                      </td>
                      <td>{accident.weather_condition}</td>
                      <td>{accident.num_vehicles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default Dashboard;
