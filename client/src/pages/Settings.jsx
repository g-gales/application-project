import { useEffect, useState } from "react";
import { useTheme } from "../components/theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axiosConfig";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";
import SummaryModal from "../components/SummaryModal";

function Settings() {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState({ courses: true, saving: false });

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

  if (!user)
    return (
      <Card title="Settings">
        <p>Please sign in.</p>
      </Card>
    );

  return (
    <div className="space-y-6">
      {/* Theme Card */}
      <Card title="Display">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-text)]">
            Switch between light and dark mode.
          </p>
          <Button onClick={toggleTheme} variant="secondary">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </Card>

      {/* Preferences Card */}
      <Card title="Summary Frequency">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-text)]">
            Current:{" "}
            <span className="capitalize">
              {user.settings?.summaryFrequency || "Weekly"}
            </span>
          </p>
          <Button
            onClick={() =>
              updatePreference(
                user.settings?.summaryFrequency === "weekly"
                  ? "daily"
                  : "weekly",
              )
            }
            disabled={loading.saving}
          >
            Toggle to{" "}
            {user.settings?.summaryFrequency === "weekly" ? "Daily" : "Weekly"}
          </Button>
        </div>
      </Card>

      {/* Course Goals Card */}
      <Card title="Course Study Goals">
        {loading.courses ? (
          <p className="text-sm animate-pulse">Loading your courses...</p>
        ) : (
          <div className="space-y-4">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {currentCourse && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex-1">
                  <p className="font-bold">{currentCourse.code}</p>
                  <p className="text-xs text-[var(--muted-text)]">
                    Weekly focus target (minutes)
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
                  className="w-20 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center text-sm"
                />
                <Button onClick={updateCourseGoal} disabled={loading.saving}>
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card
        title="Summary History"
        footer={
          <Button onClick={() => setIsSummaryOpen(true)}>
            View Summary History
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
          <p className="text-sm text-[var(--muted-text)]">
            Review your past study performance and goals.
          </p>
        </div>
      </Card>

      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        user={user}
        courses={courses}
      />
    </div>
  );
}

export default Settings;
