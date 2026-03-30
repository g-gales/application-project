import { useEffect, useState, useContext } from "react";
import { useTheme } from "../components/theme/ThemeContext";
import api from "../api/axiosConfig";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";
import { AuthContext } from "../context/authContext";

function Settings() {
  const { user, setUser, openSummary } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState({ courses: true, saving: false });

  // Fetch courses on load
  useEffect(() => {
    api
      .get("/courses")
      .then((res) => {
        const data = res.data || [];
        setCourses(data);
        if (data.length > 0) setSelectedId(data[0]._id);
      })
      .catch(() => toast.error("Failed to load courses"))
      .finally(() => setLoading((prev) => ({ ...prev, courses: false })));
  }, []);

  const currentCourse = courses.find((c) => c._id === selectedId);

  // Toggle Daily/Weekly preference
  const updatePreference = async (newFreq) => {
    setLoading((p) => ({ ...p, saving: true }));
    try {
      const res = await api.patch("/users/settings", {
        summaryFrequency: newFreq,
      });
      setUser(res.data?.data?.user || res.data);
      toast.success(`Summaries set to ${newFreq}!`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update preference.");
    } finally {
      setLoading((p) => ({ ...p, saving: false }));
    }
  };

  // Save updated minutes target for course
  const updateCourseGoal = async () => {
    if (!currentCourse) return;
    setLoading((p) => ({ ...p, saving: true }));
    try {
      await api.patch(`/courses/${selectedId}`, {
        weeklyGoalMinutes: currentCourse.weeklyGoalMinutes,
      });
      toast.success(`${currentCourse.code} goal updated!`);
    } catch (e) {
      toast.error("Failed to update course goal.", e);
    } finally {
      setLoading((p) => ({ ...p, saving: false }));
    }
  };

  if (!user) {
    return (
      <Card title="Settings">
        <p className="text-sm text-[var(--muted-text)]">Please sign in.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. THEME SELECTION */}
      <Card title="Theme Selection">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-text)]">
            Switch between light and dark mode.
          </p>
          <Button onClick={toggleTheme} variant="secondary">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </Card>

      {/* 2. COURSE STUDY GOALS */}
      <Card title="Course Study Goals">
        <p className="text-sm text-[var(--muted-text)] pb-2">
          Set your weekly goals for each course here.
        </p>
        {loading.courses ? (
          <p className="text-sm animate-pulse text-[var(--muted-text)]">
            Loading your courses...
          </p>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 w-full items-stretch md:items-center">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text)]"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Goal Editor Box */}
            {currentCourse && (
              <div className="flex flex-1 items-center gap-4 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex-1">
                  <p className="font-bold text-[var(--text)]">
                    {currentCourse.code}
                  </p>
                  <p className="text-xs text-[var(--muted-text)]">
                    Weekly target (mins)
                  </p>
                </div>

                <input
                  type="number"
                  value={currentCourse.weeklyGoalMinutes}
                  onChange={(e) =>
                    setCourses(
                      courses.map((c) =>
                        c._id === selectedId
                          ? { ...c, weeklyGoalMinutes: Number(e.target.value) }
                          : c,
                      ),
                    )
                  }
                  className="w-20 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
                />

                <Button onClick={updateCourseGoal} disabled={loading.saving}>
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 3. COMBINED SUMMARY FREQUENCY & TRIGGER */}
      <Card
        title="Study Summary Preferences"
        footer={
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                updatePreference(
                  user.settings?.summaryFrequency === "weekly"
                    ? "daily"
                    : "weekly",
                )
              }
              disabled={loading.saving}
              variant="secondary"
            >
              Toggle to{" "}
              {user.settings?.summaryFrequency === "weekly"
                ? "Daily"
                : "Weekly"}
            </Button>

            <Button className="w-full sm:w-auto" onClick={openSummary}>
              View Study Summary
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted-text)]">
            Review your recorded course times or change how often your automated
            summary overlay is automatically triggered.
          </p>
          <p className="text-sm font-semibold text-[var(--text)]">
            Current Interval:{" "}
            <span className="capitalize">
              {user.settings?.summaryFrequency || "Weekly"}
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default Settings;
