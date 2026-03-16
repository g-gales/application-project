import { useEffect, useState, useMemo } from "react";

import api from "../api/axiosConfig";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const Wellness = () => {
  const [wellnessEntries, setWellnessEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mood: 3,
    stress: 3,
    sleepHours: 7,
    focus: 3,
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchWellnessEntries();
  }, []);

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const fetchWellnessEntries = async () => {
    try {
      const res = await api.get("/wellness");
      setWellnessEntries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch wellness entries", error);
    }
  };

  const hasSubmittedToday = useMemo(() => {
    return wellnessEntries.some((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      return entryDate === today;
    });
  }, [wellnessEntries, today]);

  const todaysEntry = useMemo(() => {
    return wellnessEntries.find((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      return entryDate === today;
    });
  }, [wellnessEntries, today]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/wellness", formData);

      setMessage("Check-in saved successfully.");

      // Refresh entries after submitting
      fetchWellnessEntries();
    } catch (error) {
      console.error("Failed to save wellness entry", error);
      setMessage("Failed to save check-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack gap-md">
      <Card title="Wellness Overview" />
      <Card>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
              Daily Check-In
            </p>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-extrabold text-[var(--text)]">
                How are you feeling today?
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                Log your mood, stress, sleep, and focus to keep track of
                wellness trends over time.
              </p>
            </div>
          </div>
          {hasSubmittedToday ? (
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--green-bg)] p-4">
              <p className="text-sm font-bold text-[var(--green-text)]">
                Already submitted today
              </p>
              <p className="mt-1 text-sm text-[var(--green-text)]/90">
                Your daily wellness check-in has already been recorded.
              </p>
              <div className="flex flex-wrap gap-3 text-md text-[var(--muted-text)] pt-3">
                <p className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                  Mood: {todaysEntry.mood}
                </p>
                <p className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                  Stress: {todaysEntry.stress}
                </p>
                <p className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                  Sleep: {todaysEntry.sleepHours}h
                </p>
                <p className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                  Focus: {todaysEntry.focus}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <label
                    htmlFor="mood"
                    className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text)]">
                      Mood
                    </span>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]">
                      {formData.mood}/5
                    </span>
                  </label>
                  <input
                    id="mood"
                    type="range"
                    name="mood"
                    min="1"
                    max="5"
                    value={formData.mood}
                    onChange={handleChange}
                    className="w-full accent-[var(--primary)]"
                  />
                  <div className="mt-2 flex justify-between text-xs text-[var(--muted-text-2)]">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <label
                    htmlFor="stress"
                    className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text)]">
                      Stress
                    </span>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]">
                      {formData.stress}/5
                    </span>
                  </label>
                  <input
                    id="stress"
                    type="range"
                    name="stress"
                    min="1"
                    max="5"
                    value={formData.stress}
                    onChange={handleChange}
                    className="w-full accent-[var(--primary)]"
                  />
                  <div className="mt-2 flex justify-between text-xs text-[var(--muted-text-2)]">
                    <span>Calm</span>
                    <span>Overwhelmed</span>
                  </div>
                </div>

                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <label
                    htmlFor="sleepHours"
                    className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text)]">
                      Sleep
                    </span>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]">
                      {formData.sleepHours}h
                    </span>
                  </label>
                  <input
                    id="sleepHours"
                    type="number"
                    name="sleepHours"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    className="w-full rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-medium text-[var(--text)] placeholder:text-[var(--muted-text-2)]"
                  />
                  <p className="mt-2 text-xs text-[var(--muted-text-2)]">
                    Enter the total hours you slept last night.
                  </p>
                </div>

                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <label
                    htmlFor="focus"
                    className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text)]">
                      Focus
                    </span>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]">
                      {formData.focus}/5
                    </span>
                  </label>
                  <input
                    id="focus"
                    type="range"
                    name="focus"
                    min="1"
                    max="5"
                    value={formData.focus}
                    onChange={handleChange}
                    className="w-full accent-[var(--primary)]"
                  />
                  <div className="mt-2 flex justify-between text-xs text-[var(--muted-text-2)]">
                    <span>Scattered</span>
                    <span>Locked In</span>
                  </div>
                </div>
              </div>
              <Button type="submit" variant="primary" fullwidth>
                {loading ? "Saving..." : "Submit Check-In"}
              </Button>
            </form>
          )}
          {message && (
            <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
              {message}
            </p>
          )}

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-extrabold text-[var(--text)]">
                Recent Check-ins
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                Your most recent wellness entries.
              </p>
            </div>

            {wellnessEntries.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
                No wellness data yet.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {wellnessEntries.map((entry) => (
                  <li
                    key={entry._id}
                    className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 md:flex-row md:items-center md:justify-between">
                    <span className="text-sm font-extrabold text-[var(--text)]">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>

                    <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-text)]">
                      <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                        Mood: {entry.mood}
                      </span>

                      <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                        Stress: {entry.stress}
                      </span>

                      <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                        Sleep: {entry.sleepHours}h
                      </span>

                      <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold">
                        Focus: {entry.focus}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Card>
      <Card title="Wellness Trends" />
      <Card title="Insights & Actions" />
    </div>
  );
};

export default Wellness;
