import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AccidentMap from "./pages/AccidentMap";
import SafeRoutePage from "./pages/SafeRoutePage";
import About from "./pages/About";
import AdminPage from "./pages/admin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes — no login required ── */}
          <Route path="/"           element={<Home />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/map"        element={<AccidentMap />} />
          <Route path="/safe-route" element={<SafeRoutePage />} />
          <Route path="/about"      element={<About />} />
          <Route path="/login"      element={<Login />} />

          {/* ── Admin panel — requires a valid session ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
