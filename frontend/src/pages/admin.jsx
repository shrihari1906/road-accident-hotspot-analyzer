import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAccidents, logoutAdmin } from "../services/api";
import { useAuth } from "../context/useAuth";
import "../styles/Admin.css";

const PAGE_SIZE = 20;

// Severity sort weight for optional sort by severity
const SEVERITY_WEIGHT = { Low: 1, Medium: 2, High: 3, Fatal: 4 };

function getSeverityClass(severity) {
  return `admin-badge admin-badge--${(severity || "").toLowerCase()}`;
}

function AdminPage() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  // Use the verified user from AuthContext (not raw localStorage)
  const storedUser = authUser;

  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- filters ----
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [weatherFilter, setWeatherFilter] = useState("All Weather");

  // ---- sort ----
  const [sortKey, setSortKey] = useState("accident_date");
  const [sortDir, setSortDir] = useState("desc");

  // ---- pagination ----
  const [page, setPage] = useState(1);

  // ---- logout ----
  const handleLogout = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch {
      // best-effort
    } finally {
      logout();                              // clears context + localStorage
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  // ---- fetch ----
  useEffect(() => {
    getAccidents()
      .then((data) => {
        setAccidents(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          handleLogout();
        }
        setLoading(false);
      });
  }, [handleLogout]);

  // ---- derive filter options ----
  const cities = ["All Cities", ...new Set(accidents.map((a) => a.city))];
  const severities = ["All Severity", ...new Set(accidents.map((a) => a.severity))];
  const weathers = ["All Weather", ...new Set(accidents.map((a) => a.weather_condition))];

  // ---- filter + sort ----
  const filtered = accidents
    .filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.city.toLowerCase().includes(q) ||
        a.location_name.toLowerCase().includes(q) ||
        a.severity.toLowerCase().includes(q) ||
        (a.weather_condition || "").toLowerCase().includes(q) ||
        (a.cause || "").toLowerCase().includes(q);

      return (
        matchesSearch &&
        (cityFilter === "All Cities" || a.city === cityFilter) &&
        (severityFilter === "All Severity" || a.severity === severityFilter) &&
        (weatherFilter === "All Weather" || a.weather_condition === weatherFilter)
      );
    })
    .sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === "severity") {
        valA = SEVERITY_WEIGHT[valA] ?? 0;
        valB = SEVERITY_WEIGHT[valB] ?? 0;
      } else if (sortKey === "accident_date") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = String(valA ?? "").toLowerCase();
        valB = String(valB ?? "").toLowerCase();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  // Reset to page 1 whenever filters change — computed directly, no effect needed
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  );

  // ---- pagination ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ---- sort toggle ----
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  // ---- summary stats ----
  const total   = accidents.length;
  const fatal   = accidents.filter((a) => a.severity === "Fatal").length;
  const high    = accidents.filter((a) => a.severity === "High").length;
  const cities_ = new Set(accidents.map((a) => a.city)).size;

  return (
    <div className="admin-page">

      {/* ================= TOP BAR ================= */}
      <header className="admin-topbar" role="banner">
        <Link to="/" className="admin-topbar-brand" aria-label="Back to main site">
          <span className="admin-topbar-icon" aria-hidden="true">🚗</span>
          <span className="admin-topbar-title">Road Accident Analyzer</span>
          <span className="admin-topbar-badge">Admin</span>
        </Link>

        <div className="admin-topbar-right">
          {storedUser && (
            <span className="admin-topbar-user" aria-label={`Signed in as ${storedUser.username}`}>
              <span className="admin-topbar-user-dot" aria-hidden="true" />
              {storedUser.username}
            </span>
          )}
          <button
            className="admin-logout-btn"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            🚪 Sign Out
          </button>
        </div>
      </header>

      <main className="admin-body" role="main">

        {/* ================= PAGE HEADER ================= */}
        <div className="admin-header">
          <div className="admin-header-copy">
            <h1>Accident Records</h1>
            <p>Full dataset — filter, sort, and paginate across all recorded incidents</p>
          </div>
          <div className="admin-status" aria-label={`${total} records loaded`}>
            <span className="admin-status-dot" aria-hidden="true" />
            {loading ? "Loading…" : `${total} records`}
          </div>
        </div>

        {/* ================= STAT CARDS ================= */}
        {!loading && (
          <div className="admin-cards" role="region" aria-label="Summary statistics">
            <div className="admin-card">
              <div className="admin-card-label">Total Records</div>
              <div className="admin-card-value admin-card-value--blue">{total}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Fatal Cases</div>
              <div className="admin-card-value admin-card-value--red">{fatal}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">High Severity</div>
              <div className="admin-card-value admin-card-value--amber">{high}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Cities</div>
              <div className="admin-card-value admin-card-value--violet">{cities_}</div>
            </div>
          </div>
        )}

        {/* ================= TOOLBAR ================= */}
        <div className="admin-toolbar" role="search" aria-label="Filter accident records">

          <div className="admin-search-wrap">
            <span className="admin-search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="admin-search"
              placeholder="Search city, location, cause, severity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search records"
            />
          </div>

          <select
            className="admin-filter-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Filter by city"
          >
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="admin-filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            aria-label="Filter by severity"
          >
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="admin-filter-select"
            value={weatherFilter}
            onChange={(e) => setWeatherFilter(e.target.value)}
            aria-label="Filter by weather"
          >
            {weathers.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>

          <span className="admin-record-count" aria-live="polite">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>

        </div>

        {/* ================= TABLE ================= */}
        <div className="admin-table-wrap" role="region" aria-label="Accident records table">
          <div className="admin-table-scroll">
            <table className="admin-table" aria-label="Accident records">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort("accident_date")} aria-sort={sortKey === "accident_date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    Date{sortIcon("accident_date")}
                  </th>
                  <th>Location</th>
                  <th className="sortable" onClick={() => toggleSort("city")} aria-sort={sortKey === "city" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    City{sortIcon("city")}
                  </th>
                  <th className="sortable" onClick={() => toggleSort("severity")} aria-sort={sortKey === "severity" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    Severity{sortIcon("severity")}
                  </th>
                  <th>Weather</th>
                  <th>Road Type</th>
                  <th>Cause</th>
                  <th className="sortable" onClick={() => toggleSort("num_casualties")} aria-sort={sortKey === "num_casualties" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    Casualties{sortIcon("num_casualties")}
                  </th>
                  <th>Vehicles</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9}>
                        <div className="admin-skeleton-row" aria-hidden="true" />
                      </td>
                    </tr>
                  ))
                ) : pageSlice.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">🔍</div>
                        <div className="admin-empty-text">No records match your filters.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageSlice.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {new Date(a.accident_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="admin-td-name" title={a.location_name}>
                        {a.location_name}
                      </td>
                      <td>{a.city}</td>
                      <td>
                        <span className={getSeverityClass(a.severity)}>
                          {a.severity}
                        </span>
                      </td>
                      <td>{a.weather_condition}</td>
                      <td>{a.road_type || "—"}</td>
                      <td>{a.cause || "—"}</td>
                      <td>{a.num_casualties ?? "—"}</td>
                      <td>{a.num_vehicles ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}
          {!loading && filtered.length > PAGE_SIZE && (
            <nav className="admin-pagination" aria-label="Table pagination">
              <span className="admin-pagination-info">
                Page {currentPage} of {totalPages} · {filtered.length} records
              </span>

              <div className="admin-pagination-controls">
                <button
                  className="admin-page-btn"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  «
                </button>
                <button
                  className="admin-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {/* Show up to 5 page numbers centred on current page */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const pageNum = start + i;
                  return (
                    <button
                      key={pageNum}
                      className={`admin-page-btn ${pageNum === currentPage ? "admin-page-btn--active" : ""}`}
                      onClick={() => setPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={pageNum === currentPage ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="admin-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
                <button
                  className="admin-page-btn"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  »
                </button>
              </div>
            </nav>
          )}
        </div>

      </main>
    </div>
  );
}

export default AdminPage;
