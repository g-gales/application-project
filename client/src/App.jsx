import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react"; // lazy loading to reduce initial package size
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import Courses from "./components/Courses";
import CourseDetails from "./components/CourseDetails";
import Calendar from "./components/Calendar";
import SimpleCalendar from "./components/SimpleCalendar.jsx";

import AppLayout from "./layout/AppLayout";

import LoadingSpinner from "./components/ui/LoadingSpinner";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Wellness = lazy(() => import("./pages/Wellness"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const Flashcards = lazy(() => import("./pages/Flashcards"));

import { ThemeProvider } from "./components/theme/ThemeContext";

import "./styles/global.css";

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/app/dashboard" replace /> : <Login />
            }
          />

          {/* Protected Routes - everything here requires being logged in */}
          <Route element={<ProtectedRoute />}>
            {/* App shell + nested pages */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="/courses/:courseId" element={<CourseDetails />} />
              <Route path="wellness" element={<Wellness />} />
              <Route path="pomodoro" element={<Pomodoro />} />
              <Route path="flashcards" element={<Flashcards />} />
            </Route>
            {/* <Route path="/test-component" element={<TestComponent />} /> */}
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<h1>Page Not Found</h1>} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
