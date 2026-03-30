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
      const lastViewed = user.lastSummaryViewedAt
        ? new Date(user.lastSummaryViewedAt)
        : new Date();
      const now = new Date();

      const frequency = user.settings?.summaryFrequency || "weekly";

      // difference in days between now and last viewed
      const diffInMs = now - lastViewed;
      const daysSince = diffInMs / (1000 * 60 * 60 * 24);

      if (frequency === "daily" && daysSince >= 1) {
        setShowSummary(true);
      } else if (frequency === "weekly" && daysSince >= 7) {
        setShowSummary(true);
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
      toast.error("Couldn't save read receipt.");
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
