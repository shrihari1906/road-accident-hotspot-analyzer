import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { logoutAdmin } from "../services/api";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authReady, isAdmin, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try { await logoutAdmin(); } catch { /* best-effort */ }
    logout();
    navigate("/", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
      <div className="container-fluid px-4">

        {/* Brand */}
        <Link to="/" className="navbar-brand fw-bold" style={{ fontSize: "20px" }}>
          🚗 Road Accident Hotspot Analyzer
        </Link>

        {/* Mobile toggle — works now that bootstrap.bundle.min.js is imported */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMenu"
          aria-controls="navbarMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarMenu">

          {/* Main nav links */}
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link to="/" className={`nav-link ${isActive("/") ? "active fw-bold" : ""}`}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active fw-bold" : ""}`}>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/map" className={`nav-link ${isActive("/map") ? "active fw-bold" : ""}`}>
                Hotspots
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/safe-route" className={`nav-link ${isActive("/safe-route") ? "active fw-bold" : ""}`}>
                Safe Route
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className={`nav-link ${isActive("/about") ? "active fw-bold" : ""}`}>
                About
              </Link>
            </li>
          </ul>

          {/* Right side: Admin Login link (when not logged in) */}
          {authReady && !isAdmin && (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link
                  to="/login"
                  className={`nav-link d-flex align-items-center gap-1 ${isActive("/login") ? "active fw-bold" : ""}`}
                >
                  🔐 Admin Login
                </Link>
              </li>
            </ul>
          )}

          {/* Admin chrome — only after a verified admin session */}
          {authReady && isAdmin && user?.username && (
            <ul className="navbar-nav ms-auto align-items-center gap-2">
              <li className="nav-item">
                <Link
                  to="/admin"
                  className={`nav-link d-flex align-items-center gap-1 ${isActive("/admin") ? "active fw-bold" : ""}`}
                  title="Admin Panel"
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      marginRight: 4,
                      flexShrink: 0,
                      boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                    }}
                    aria-hidden="true"
                  />
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
                    {user.username}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 5,
                      background: "rgba(25,118,210,0.25)",
                      border: "1px solid rgba(25,118,210,0.4)",
                      color: "#90caf9",
                      letterSpacing: "0.04em",
                      fontFamily: "JetBrains Mono, monospace",
                      textTransform: "uppercase",
                      marginLeft: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    admin
                  </span>
                </Link>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-sm"
                  style={{
                    background: "rgba(255,87,34,0.12)",
                    border: "1px solid rgba(255,87,34,0.3)",
                    color: "#ff8a65",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12,
                    padding: "5px 12px",
                    borderRadius: 7,
                    whiteSpace: "nowrap",
                  }}
                  onClick={handleLogout}
                  aria-label="Sign out of admin"
                >
                  Sign Out
                </button>
              </li>
            </ul>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
