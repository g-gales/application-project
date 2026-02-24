import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";

import AppLayout from "./layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Wellness from "./pages/Wellness";
import Pomodoro from "./pages/Pomodoro";
import Flashcards from "./pages/Flashcards";

import { ThemeProvider } from "./components/theme/ThemeContext";

import "./styles/global.css";

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected Routes - everything here requires being logged in */}
        <Route element={<ProtectedRoute />}>
          {/* App shell + nested pages */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="wellness" element={<Wellness />} />
            <Route path="pomodoro" element={<Pomodoro />} />
            <Route path="flashcards" element={<Flashcards />} />
          </Route>
          {/* <Route path="/test-component" element={<TestComponent />} /> */}
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
