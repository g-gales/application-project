import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected Routes - everything here requires being logged in */}
      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* TODO: additional routes added here:
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/wellness" element={<Wellness />} /> */
        /* */}
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<h1>Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
