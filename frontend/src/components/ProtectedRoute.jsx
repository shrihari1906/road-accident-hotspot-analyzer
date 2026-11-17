import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// -------------------------------------------------------
// ProtectedRoute — guards any route behind an admin session.
//
// Three states:
//   authReady=false → still verifying token against backend, show nothing
//   authReady=true, isAdmin=false → not authenticated, redirect to /login
//   authReady=true, isAdmin=true → authenticated admin, render children
//
// The `state={{ from: location }}` on the redirect lets login.jsx
// send the user back to where they were trying to go after sign-in.
// -------------------------------------------------------

function ProtectedRoute({ children }) {
  const { isAdmin, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
