import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIXME: not sure if keeping this
  //  weekly or daily summary to show when user hasn't checked the app for long
  const [showSummary, setShowSummary] = useState(false);
  useEffect(() => {
    if (user) {
      const lastViewed = new Date(user.lastSummaryViewedAt || 0);
      const now = new Date();
      const daysSince = (now - lastViewed) / (1000 * 60 * 60 * 24);

      if (user.settings?.summaryFrequency === "weekly" && daysSince >= 7) {
        setShowSummary(true);
      } else if (
        user.settings?.summaryFrequency === "daily" &&
        daysSince >= 1
      ) {
        setShowSummary(true);
      }
    }
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // on refresh, this runs the getMe route in /server which verifies the user again
        const res = await api.get("/users/me");
        setUser(res.data.data.user);
      } catch (error) {
        console.error("Backend auth check failed:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
