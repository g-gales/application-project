import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/ui/LoadingSpinner";

/**
 * A wrapper component that protects sensitive routes from unauthenticated access.
 * 1. While loading, it displays a full-screen loading spinner.
 * 2. If the user is authenticated, it renders an `<Outlet />`, which acts as a
 * placeholder for the nested child routes defined in App.jsx.
 * 3. If the user is not authenticated, it redirects them to the `/login` page.
 * @component
 * @returns {JSX.Element} The active child route (via Outlet) or a redirection to Login.
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // loading while waiting for the auth check
  if (loading) return <LoadingSpinner />;

  // if no user, send them to /login
  // 'replace' prevents the back button from working
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
