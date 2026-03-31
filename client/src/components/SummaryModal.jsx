import { useState, useMemo, useEffect } from "react";
import Modal from "./ui/Modal";
import {
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import toast from "react-hot-toast";
import { useWeeklyStudySummary } from "../hooks/useWeeklyStudySummary";

// fallback helper for inputting correct theme color into circular progress bars
const getCSSVariableColor = (variableName, fallbackColor) => {
  if (typeof window === "undefined") return fallbackColor;
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return color || fallbackColor;
};

function SummaryModal({ isOpen, onClose, courses }) {
  const [offset, setOffset] = useState(0);

  const {
    weeklyStudySummary: courseSummary,
    dailyBreakdown,
    isLoading: loading,
    error,
  } = useWeeklyStudySummary(offset, isOpen);

  useEffect(() => {
    if (error && isOpen) {
      toast.error("Could not load your study summary.");
    }
  }, [error, isOpen]);

  // get min and most minutes courses for highlights
  const { mostEffort, leastEffort } = useMemo(() => {
    const list = courseSummary;
    if (list.length === 0) return { mostEffort: null, leastEffort: null };

    const sortedList = [...list].sort(
      (a, b) => b.totalMinutes - a.totalMinutes,
    );

    return {
      mostEffort: sortedList[0],
      leastEffort:
        sortedList.length > 1 ? sortedList[sortedList.length - 1] : null,
    };
  }, [courseSummary]);

  const mappedWeeklyData = useMemo(() => {
    const baseWeek = [
      { day: "Su", id: 1, minutes: 0 },
      { day: "M", id: 2, minutes: 0 },
      { day: "T", id: 3, minutes: 0 },
      { day: "W", id: 4, minutes: 0 },
      { day: "Th", id: 5, minutes: 0 },
      { day: "F", id: 6, minutes: 0 },
      { day: "Sa", id: 7, minutes: 0 },
    ];

    // set minutes from baseWeek for each day based on fetched data
    dailyBreakdown.forEach((item) => {
      const dayRef = baseWeek.find((b) => String(b.id) === String(item._id));
      if (dayRef) {
        dayRef.minutes = item.minutes;
      }
    });

    const maxMinutes = Math.max(...baseWeek.map((b) => b.minutes));
    const weeklyMaxGoal = maxMinutes > 0 ? maxMinutes : 60;

    const mapped = baseWeek.map((dayObj) => ({
      ...dayObj,
      percentage: Math.min(
        Math.round((dayObj.minutes / weeklyMaxGoal) * 100),
        100,
      ),
      isPeakDay: dayObj.minutes === maxMinutes && maxMinutes > 0,
    }));

    return mapped;
  }, [dailyBreakdown]);

  // data range for card pagination
  const dateRange = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - dayOfWeek);

    const start = new Date(currentSunday);
    start.setDate(currentSunday.getDate() + offset * 7);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }, [offset]);

  // controls for card pagination
  const datePagination = (
    <div className="flex items-center justify-between p-2 mb-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
      <button
        onClick={() => setOffset((prev) => prev - 1)}
        className="p-2 hover:text-[var(--primary)] transition-colors"
      >
        <FiChevronLeft size={30} />
      </button>

      <span className="font-bold uppercase tracking-widest text-[var(--text)]">
        {dateRange}
      </span>

      <button
        disabled={offset >= 0}
        onClick={() => setOffset((prev) => prev + 1)}
        className={`p-2 transition-colors ${offset >= 0 ? "opacity-10 cursor-not-allowed" : "hover:text-[var(--primary)]"}`}
      >
        <FiChevronRight size={30} />
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={datePagination}>
      {loading ? (
        <div className="text-center py-10 text-sm text-[var(--muted-text)] font-semibold">
          Loading summary data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* DAILY WORKLOAD RINGS */}
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]  text-center">
              Daily Activity
            </h3>
            <div className="flex gap-1 sm:gap-2 justify-between items-center  max-w-md mx-auto">
              {mappedWeeklyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10">
                    <CircularProgressbar
                      value={item.percentage}
                      strokeWidth={12}
                      styles={buildStyles({
                        pathColor: item.isPeakDay
                          ? getCSSVariableColor("--primary", "#2b59ff")
                          : getCSSVariableColor("--hover-primary", "#8da4e1"),
                        trailColor: getCSSVariableColor("--surface", "#ffffff"),
                        strokeLinecap: "round",
                      })}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold ${item.isPeakDay ? "text-[var(--primary)]" : "text-[var(--text)]"}`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MOST EFFORT HIGHLIGHT */}
          {mostEffort && (
            <div className="most-effort p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backgroundColor: "var(--green-bg)",
                    color: "var(--green-text)",
                  }}
                >
                  <FiTrendingUp size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">
                    Top Course This Week
                  </span>
                  <h3 className="text-base font-bold text-[var(--text)]">
                    {mostEffort.courseDetails.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-text)]">
                    You've crushed it with&nbsp;
                    <span className="font-bold text-[var(--text)]">
                      {mostEffort.totalMinutes} minutes
                    </span>
                    &nbsp;of study. Keep it up!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LEAST EFFORT HIGHLIGHT */}
          {leastEffort && (
            <div className="least-effort p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{
                    backgroundColor: "var(--danger-bg)",
                    color: "var(--danger-text)",
                  }}
                >
                  <FiAlertCircle size={0} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">
                    Needs Attention
                  </span>
                  <h3 className="text-base font-bold text-[var(--text)]">
                    {leastEffort.courseDetails.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-text)]">
                    Only&nbsp;
                    <span className="font-bold text-[var(--text)]">
                      {leastEffort.totalMinutes} minutes
                    </span>
                    &nbsp;recorded. Consider focusing here next!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ALL COURSES PROGRESS LIST */}
          <div className="courses-progress p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)] mb-4 text-center">
              All Courses Breakdown
            </h3>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {courseSummary.length > 0 ? (
                courseSummary.map((item) => {
                  const courseConfig = courses.find((c) => c._id === item._id);
                  const goal = courseConfig?.weeklyGoalMinutes || 120;
                  const percentage = Math.min(
                    Math.round((item.totalMinutes / goal) * 100),
                    100,
                  );

                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-[var(--text)]">
                          {item.courseDetails.name}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[var(--primary)]">
                          {percentage}%
                        </span>
                      </div>

                      <div className="h-2 w-full bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              item.courseDetails.color || "var(--primary)",
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-[var(--muted-text)] uppercase font-semibold">
                        <span>{item.totalMinutes} mins done</span>
                        <span>Goal: {goal} mins</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-[var(--muted-text)] py-4">
                  No activity tracked for courses during this period.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SummaryModal;
