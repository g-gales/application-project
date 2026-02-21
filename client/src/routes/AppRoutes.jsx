import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";

// lazy() for all components
const Login = lazy(() => import("../pages/Login"));
import PageLoader from "../components/PageLoader"; // Import the new component
// const Calendar = lazy(() => import("../pages/Calendar"));
// const Pomodoro = lazy(() => import("../pages/Pomodoro"));
// const Wellness = lazy(() => import("../pages/Wellness"));
// const Assignments = lazy(() => import("../pages/Assignments"));
// const Grades = lazy(() => import("../pages/Grades"));
// const Profile = lazy(() => import("../pages/Profile"));
// const Settings = lazy(() => import("../pages/Settings"));
// const Resources = lazy(() => import("../pages/Resources"));

// FIXME: delete this with a normal import when done
const Dashboard = lazy(() => {
  return Promise.all([
    import("../components/Dashboard"),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]).then(([moduleExports]) => moduleExports);
});

const AppRoutes = ({ user }) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* TODO: all additional routes added here */}
          {/* <Route path="/calendar" element={<Calendar />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/settings" element={<Settings />} /> */}
        </Route>

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
