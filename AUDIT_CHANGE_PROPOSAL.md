# Audit Change Proposal — Road Accident Hotspot Analyzer
**Date:** August 23, 2026  
**Status:** Awaiting approval before any implementation

---

## Issue #1 — CRITICAL: `filteredaccidents.jsx` is not a valid React component
**File:** `frontend/src/components/filteredaccidents.jsx`  
**What:** Raw filter logic with no function wrapper, no props, no export. References undefined variables. Uses `accident.weather` (wrong — API returns `accident.weather_condition`).  
**Impact:** Dead code — crashes on import. Never used anywhere.  
**Fix:** Delete the file, or refactor into a proper exported utility function.  
**Effort:** 15 min | **Risk:** None (unreferenced)

---

## Issue #2 — MEDIUM: `filterpanel.jsx` and `accidenttable.jsx` are unused
**Files:** `frontend/src/components/filterpanel.jsx`, `accidenttable.jsx`  
**What:** Both are fully built with proper exports but never imported in any active page.  
**Impact:** Dead code — marginal bundle size increase, confusion about intended UI.  
**Fix:** Integrate `FilterPanel` into `AccidentMap.jsx` to replace inline dropdowns (adds date filter), or delete both.  
**Effort:** 30–45 min

---

## Issue #3 — LOW: `login.jsx` and `admin.jsx` are empty stub files
**Files:** `frontend/src/pages/login.jsx`, `frontend/src/pages/admin.jsx`  
**What:** Both files are completely empty. No routes defined for them in `App.jsx`.  
**Fix:** Delete both, or document as out-of-scope in README.  
**Effort:** 5 min

---

## Issue #4 — MEDIUM: `services/api.js` is empty — hardcoded URLs scattered everywhere
**File:** `frontend/src/services/api.js`  
**What:** All API calls use hardcoded `http://127.0.0.1:5000` across 4 pages and 2 components.  
**Impact:** Changing the backend URL requires editing every file individually.  
**Fix:** Populate `api.js` with a centralized Axios instance + named functions (`getAccidents`, `getDashboardStats`, `getHotspots`, `getRouteRisk`). Replace all inline calls.  
**Effort:** 1–2 hr

---

## Issue #5 — MEDIUM: `DashboardCards` counter doesn't re-animate on filter change
**File:** `frontend/src/components/Dashboardcards.jsx`  
**What:** `counted.current = true` is set once and never reset. After a search/filter changes the value, the counter updates the number but skips the animation.  
**Fix:** Reset `counted.current = false` inside the `useEffect` dependency on `endValue`.  
**Effort:** 10 min

---

## Issue #6 — MEDIUM: O(n×m) route risk calculation with no spatial pre-filter
**File:** `backend/services/accident_service.py` — `calculate_route_risk()`  
**What:** Loops over all 500 accidents × all route coordinates. Up to ~1,000,000 Haversine calls per request. Scales poorly with larger datasets.  
**Fix:** Add bounding-box pre-filter (simple arithmetic) before the Haversine loop to eliminate accidents clearly outside the route area.  
**Effort:** 30 min

---

## Issue #7 — LOW: No type validation on `/api/route-risk` coordinates
**File:** `backend/app.py` + `accident_service.py`  
**What:** Malformed coordinates (non-numeric) cause unhandled `float()` ValueError → 500 error.  
**Fix:** Wrap coordinate parsing in try/except, return 400 with descriptive message.  
**Effort:** 15 min

---

## Issue #8 — LOW: `AccidentMap.jsx` over-fetches 500 records for filter dropdowns only
**File:** `frontend/src/pages/AccidentMap.jsx`  
**What:** Fetches all 500 accident records to build 3 filter dropdowns and the HotspotInsights chart — but the map itself uses `/api/hotspots` (30 city-aggregated records) independently.  
**Fix:** Use `/api/hotspots` for map page; add lightweight `/api/filter-options` endpoint for distinct dropdown values, or keep current approach and note the tradeoff.  
**Effort:** 20 min

---

## Issue #9 — LOW: `.env` credentials committed without `.gitignore`
**File:** `backend/.env`  
**What:** Live NeonDB connection string (with plaintext password) and SECRET_KEY in `.env`. No `.gitignore` present in backend directory.  
**Fix:** Add `backend/.env` to `.gitignore`, rotate DB password, add `.env.example` with placeholder values.  
**Effort:** 15 min

---

## Priority Order (suggested)
| Priority | Issue | Severity | Effort |
|---|---|---|---|
| 1 | #1 — broken filteredaccidents.jsx | Critical | 15 min |
| 2 | #9 — .env credentials exposed | Security | 15 min |
| 3 | #4 — empty api.js / hardcoded URLs | Medium | 1–2 hr |
| 4 | #5 — counter animation regression | Medium | 10 min |
| 5 | #6 — O(n×m) route risk | Medium | 30 min |
| 6 | #7 — coordinate type validation | Low | 15 min |
| 7 | #2 — unused components | Low | 30–45 min |
| 8 | #8 — AccidentMap over-fetch | Low | 20 min |
| 9 | #3 — empty stub files | Low | 5 min |
