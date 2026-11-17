import axios from "axios";

// Single source of truth for the backend base URL.
// Update this one line if the backend moves — no need to touch every page.
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Automatically attach the JWT (if present) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Session 401 handler — wrong login credentials must stay on the form.
// Only drop a stored session when an authenticated request is rejected.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isLoginAttempt = url.includes("/api/auth/login");

    if (status === 401 && !isLoginAttempt) {
      const hadSession = !!localStorage.getItem("admin_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      if (hadSession && window.location.pathname.startsWith("/admin")) {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------
// Auth
// -------------------------------------------------------

/** POST /api/auth/login */
export const loginAdmin = (username, password) =>
  api.post("/api/auth/login", { username, password }).then((res) => res.data);

/** POST /api/auth/logout */
export const logoutAdmin = () =>
  api.post("/api/auth/logout").then((res) => res.data);

/** GET /api/auth/me — verify stored token is still valid */
export const getMe = () =>
  api.get("/api/auth/me").then((res) => res.data);

// -------------------------------------------------------
// Public data
// -------------------------------------------------------

/** GET /api/accidents — full accident records, ordered by date desc */
export const getAccidents = () =>
  api.get("/api/accidents").then((res) => res.data);

/** GET /api/dashboard — severity breakdown counts */
export const getDashboardStats = () =>
  api.get("/api/dashboard").then((res) => res.data);

/** GET /api/hotspots — city-level aggregates with lat/lon/count */
export const getHotspots = () =>
  api.get("/api/hotspots").then((res) => res.data);

/** GET /api/accident-locations — minimal lat/lon/severity/city list */
export const getAccidentLocations = () =>
  api.get("/api/accident-locations").then((res) => res.data);

/**
 * POST /api/route-risk
 * @param {Array} coordinates - array of [longitude, latitude] pairs
 * @returns {{ nearby_accidents: number, risk: string, recommendation: string }}
 */
export const getRouteRisk = (coordinates) =>
  api.post("/api/route-risk", { coordinates }).then((res) => res.data);
