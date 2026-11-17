import { useState, useCallback, useEffect, useMemo } from "react";
import { AuthContext } from "./authContextObj";
import { getMe } from "../services/api";

export { AuthContext };

function clearStoredSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

/** Accept only a verified admin identity. Maps JWT `sub` → `id`. */
export function normalizeUser(payload) {
  if (!payload || typeof payload !== "object") return null;
  const username = payload.username;
  const role = payload.role;
  const id = payload.id ?? payload.sub;
  if (!username || role !== "admin") return null;
  return { id, username, role };
}

export function AuthProvider({ children }) {
  // null = still verifying | false = unauthenticated | object = authenticated user
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      clearStoredSession();
      setUser(false);
      setAuthReady(true);
      return;
    }

    getMe()
      .then((payload) => {
        const normalized = normalizeUser(payload);
        if (!normalized) {
          clearStoredSession();
          setUser(false);
        } else {
          localStorage.setItem("admin_user", JSON.stringify(normalized));
          setUser(normalized);
        }
        setAuthReady(true);
      })
      .catch(() => {
        clearStoredSession();
        setUser(false);
        setAuthReady(true);
      });
  }, []);

  const login = useCallback((token, userPayload) => {
    const normalized = normalizeUser(userPayload);
    if (!token || !normalized) {
      clearStoredSession();
      setUser(false);
      return;
    }
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(normalized));
    setUser(normalized);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(false);
  }, []);

  const isAdmin = Boolean(user && user.role === "admin");

  const value = useMemo(
    () => ({ user, authReady, isAdmin, login, logout }),
    [user, authReady, isAdmin, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
