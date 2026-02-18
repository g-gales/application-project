import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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

  // waiting for the auth check
  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  // if no user, send them to /login
  // 'replace' prevents the back button from working
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
