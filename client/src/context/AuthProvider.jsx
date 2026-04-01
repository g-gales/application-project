import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { AuthContext } from "./authContext";
import toast from "react-hot-toast";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [hasCheckedSummary, setHasCheckedSummary] = useState(false);

  // show summary modal based on user settings and last viewed timestamp
  useEffect(() => {
    if (user && !hasCheckedSummary) {
      const now = new Date();
      const frequency = user.settings?.summaryFrequency || "weekly";

      const isMorning = now.getHours() >= 6;

      const lastViewed = user.lastSummaryViewedAt
        ? new Date(user.lastSummaryViewedAt)
        : new Date(0);

      const todayDateOnly = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const lastDateOnly = new Date(
        lastViewed.getFullYear(),
        lastViewed.getMonth(),
        lastViewed.getDate(),
      );

      const isNewDay = todayDateOnly > lastDateOnly;
      const isSaturday = now.getDay() === 6; // 0 = Sunday, 6 = Saturday

      if (frequency === "daily") {
        // if it's a new day and at least 6 AM, show the summary
        if (isNewDay && isMorning) {
          setShowSummary(true);
        }
      } else if (frequency === "weekly") {
        // if it's a new day AND Saturday AND at least 6 AM
        if (isNewDay && isSaturday && isMorning) {
          setShowSummary(true);
        }
      }

      setHasCheckedSummary(true);
    }
  }, [user, hasCheckedSummary]);

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
        toast.error("Couldn't authenticate user. Try logging in again.");
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
    setHasCheckedSummary(false);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // on logout, this will trigger a hard refresh to flush react memory and reset all state + axios token
    window.location.href = "/login";
  };

  const closeSummary = async () => {
    setShowSummary(false);

    try {
      // save lastviewd timestamp to user settings in backend
      const res = await api.patch("/users/settings", {
        lastSummaryViewedAt: new Date().toISOString(),
      });

      // update user data so state is fresh
      setUser(res.data?.data?.user || res.data);
    } catch (e) {
      console.error("Failed to save summary viewed timestamp", e);
    }
  };
  const openSummary = () => {
    setShowSummary(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        showSummary,
        closeSummary,
        openSummary,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
