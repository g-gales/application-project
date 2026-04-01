import { useState, useMemo } from "react";
import api from "../../api/axiosConfig";

import Card from "../ui/Card";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const WellnessCheckIn = ({ hasSubmittedToday, onSuccess, wellnessEntries }) => {
  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mood: 3,
    stress: 3,
    sleepHours: 7,
    focus: 3,
  }); //acts as placeholders
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  //Handle Form Changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setJustSubmitted(false);

    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  //Handle Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/wellness", {
        ...formData,
        date: selectedDate,
      });

      if (onSuccess) {
        await onSuccess();
      }

      setMessage("Check-in saved successfully.");
      setJustSubmitted(true);

      setFormData({
        mood: 3,
        stress: 3,
        sleepHours: 7,
        focus: 3,
      });

      setSelectedDate(today);
    } catch (error) {
      console.error("Failed to save wellness entry", error);
      setMessage("Failed to save check-in.");
      setJustSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setJustSubmitted(false);
    setMessage("");
  };

  const submittedDates = useMemo(() => {
    return new Set(
      wellnessEntries.map(
        (entry) => new Date(entry.date).toISOString().split("T")[0],
      ),
    );
  }, [wellnessEntries]);

  const selectedDateAlreadyExists = submittedDates.has(selectedDate);

  const showSelectedDateWarning = selectedDateAlreadyExists && !justSubmitted;

  return (
    <Card title="Daily Check-In">
      <div className="flex flex-col gap-6">
        <div className="flex flex-row gap-6 md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-[var(--text)]">
                How are you feeling today?
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                Log your mood, stress, sleep, and focus to keep track of
                wellness trends over time.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-6">
            {hasSubmittedToday && (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--green-bg)] px-4 py-3">
                <p className="text-sm font-bold text-[var(--green-text)]">
                  Today’s check-in is already complete.
                </p>
                <p className="mt-1 text-sm text-[var(--green-text)]/90">
                  You can still add an entry for a previous day if you missed
                  one.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 gap-8 md:self-end md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col">
                <label
                  htmlFor="entryDate"
                  className="text-sm font-bold text-[var(--text)]">
                  Entry Date
                </label>
                <p className="text-xs text-[var(--muted-text-2)]">
                  Defaults to today. Previous dates only.
                </p>
              </div>
              <div>
                <input
                  id="entryDate"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={today}
                  className="w-full rounded-[calc(var(--radius)-6px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] md:w-auto md:min-w-[250px]"
                />

                {showSelectedDateWarning && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    A wellness check-in already exists for this date.
                  </p>
                )}
              </div>
            </div>
          </div>
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
          <Button
            type="submit"
            variant="primary"
            fullwidth="true"
            disabled={loading || submittedDates.has(selectedDate)}>
            {loading ? "Saving..." : "Submit Check-In"}
          </Button>
        </form>
        {/* )} */}
        {message && (
          <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
            {message}
          </p>
        )}
        <Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
          View Recent Check-Ins
        </Button>
      </div>
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Recent Check-Ins">
        <section className="flex flex-col gap-4 w-full md:w-[680px]">
          <div className="flex flex-col gap-1">
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
      </Modal>
    </Card>
  );
};

export default WellnessCheckIn;
