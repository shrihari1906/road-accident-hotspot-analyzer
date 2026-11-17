import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { loginAdmin } from "../services/api";
import { useAuth } from "../context/useAuth";
import "../styles/Login.css";

function validateForm(username, password) {
  const errors = {};
  if (!username.trim()) {
    errors.username = "Username is required.";
  } else if (username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.username = "Username may only contain letters, numbers, and underscores.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

function Login() {
  const navigate = useNavigate();
  const { login, isAdmin, authReady } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const isLocked = lockedUntil !== null && now < lockedUntil;

  // Tick every second while locked so the button re-enables itself
  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  if (!authReady) return null;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (isLocked) return;

    const errors = validateForm(username, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { token, user: loggedInUser } = await loginAdmin(username.trim(), password);
      login(token, loggedInUser);
      setAttempts(0);
      navigate("/admin", { replace: true });
    } catch (err) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLockedUntil(Date.now() + 30_000);
        setServerError("Too many failed attempts. Please wait 30 seconds before trying again.");
      } else {
        setServerError(
          err?.response?.data?.error || "Unable to sign in. Please check your credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-bg-grid" aria-hidden="true" />
      <div className="login-bg-glow" aria-hidden="true" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon" aria-hidden="true">🚗</div>
          <div className="login-logo-text">
            <span className="login-logo-title">Road Accident Analyzer</span>
            <span className="login-logo-sub">Admin Portal</span>
          </div>
        </div>

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-subheading">Sign in to access the admin panel</p>

        {serverError && (
          <div className="login-alert" role="alert" aria-live="assertive">
            <span className="login-alert-icon" aria-hidden="true">⚠️</span>
            {serverError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-label="Admin sign in form">

          <div className="login-field">
            <label className="login-label" htmlFor="login-username">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">👤</span>
              <input
                id="login-username"
                type="text"
                className={`login-input ${fieldErrors.username ? "login-input--error" : ""}`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: "" })); }}
                autoComplete="username"
                autoFocus
                disabled={isLocked || loading}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
              />
            </div>
            {fieldErrors.username && (
              <p className="login-field-error" id="username-error" role="alert">⚠ {fieldErrors.username}</p>
            )}
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">🔒</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`login-input ${fieldErrors.password ? "login-input--error" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                autoComplete="current-password"
                disabled={isLocked || loading}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="login-field-error" id="password-error" role="alert">⚠ {fieldErrors.password}</p>
            )}
          </div>

          <button type="submit" className="login-btn" disabled={loading || isLocked} aria-busy={loading}>
            {loading ? (
              <><span className="login-spinner" aria-hidden="true" /> Signing in...</>
            ) : isLocked ? (
              "Too many attempts — wait 30 s"
            ) : (
              "Sign In"
            )}
          </button>

        </form>

        <div className="login-footer">
          <Link to="/" className="login-footer-link">← Back to main site</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
