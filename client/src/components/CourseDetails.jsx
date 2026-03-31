import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { useWeeklyStudySummary } from "../hooks/useWeeklyStudySummary";
import { formatMinutesToHoursMinutes } from "../utils/timeUtils";
import LoadingSpinner from "./ui/LoadingSpinner";
import Card from "../components/ui/Card";

// helper functions
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fmtDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "—";
  const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};
const progressPct = (done, total) => {
  const t = Number(total || 0);
  const d = Number(done || 0);
  if (!t) return 0;
  return clamp(Math.round((d / t) * 100), 0, 100);
};
const dueLabel = (yyyyMmDd) => {
  if (!yyyyMmDd) return "";
  const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
  const due = new Date(Date.UTC(y, m - 1, d));
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const diffDays = Math.round((due - todayUTC) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d late`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays}d`;
};
const statusPill = (status) => {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "done")
    return `${base} bg-[var(--green-bg)] text-[var(--green-text)]`;
  if (status === "in-progress")
    return `${base} bg-[var(--tertiary)] text-[var(--tertiary-contrast)]`;
  return `${base} bg-[var(--bg)] text-[var(--muted-text)]`;
};
const toInputDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// *** COMPONENT ***
export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [error, setError] = useState("");

  const blankForm = {
    id: "",
    title: "",
    dueDate: "",
    estimatedMinutes: 60,
    minutesCompleted: 0,
    status: "not-started",
    notes: "",
  };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    const getCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data);
      } catch (error) {
        console.log("Error loading course:", error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) getCourse();
  }, [courseId]);

  const sortedAssignments = useMemo(() => {
    if (!course?.assignments) return [];
    return [...course.assignments].sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      return String(a.dueDate || "").localeCompare(String(b.dueDate || ""));
    });
  }, [course]);

  const nextDue = useMemo(() => {
    if (!course?.assignments) return null;
    const upcoming = course.assignments
      .filter((a) => a.status !== "done" && a.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    return upcoming[0] ?? null;
  }, [course]);

  const { weeklyStudyMinutesByCourseId } = useWeeklyStudySummary();
  const weeklyStudyTime = course ? weeklyStudyMinutesByCourseId[course._id] : 0;

  const weeklyStudyPct = course
    ? progressPct(weeklyStudyTime, course.weeklyGoalMinutes)
    : 0;

  const totalUpcomingMinutes = useMemo(() => {
    if (!course?.assignments) return 0;
    return course.assignments
      .filter((a) => a.status !== "done")
      .reduce((sum, a) => sum + Number(a.estimatedMinutes || 0), 0);
  }, [course]);

  if (loading) return <LoadingSpinner size={"small"} />;

  const openAdd = () => {
    setMode("add");
    setForm({ ...blankForm, dueDate: toInputDate(new Date()) });
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (a) => {
    setMode("edit");
    setForm({ ...a });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(blankForm);
    setError("");
  };

  const saveAssignment = async () => {
    if (!form.title.trim() || !form.dueDate)
      return setError("Required fields missing.");

    const est = Number(form.estimatedMinutes);
    const done = Number(form.minutesCompleted);

    if (Number.isNaN(est) || est < 0)
      return setError("Estimated minutes must be 0 or more.");
    if (Number.isNaN(done) || done < 0)
      return setError("Completed minutes must be 0 or more.");

    setError("");

    try {
      const payload = {
        ...form,
        courseId,
        estimatedMinutes: est,
        minutesCompleted: clamp(done, 0, est || done),
      };

      if (mode === "add") {
        await api.post("/assignments", payload);
      } else {
        await api.put(`/assignments/${form._id}`, payload);
      }

      // get course data
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
      closeModal();
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to save assignment to database.");
    }

    closeModal();
  };

  const deleteAssignment = async (id) => {
    const ok = window.confirm("Delete this assignment? This can't be undone.");
    if (!ok) return;

    try {
      await api.delete(`/assignments/${id}`);
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const toggleDone = async (id) => {
    // find current assignment to flip its status
    const current = course.assignments.find((a) => a._id === id);
    if (!current) return;

    const newStatus = current.status === "done" ? "not-started" : "done";

    try {
      await api.put(`/assignments/${id}`, { ...current, status: newStatus });
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  if (course === null) {
    return (
      <div className="min-h-screen p-6 bg-[var(--surface)] flex items-center justify-center">
        <div className="mx-auto max-w-md text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Course Not Found
          </h1>
          <p className="mt-3 text-sm text-[var(--muted-text)]">
            We couldn't find a course with ID: <br />
            <code className="mt-2 block rounded bg-[var(--bg)] px-2 py-1 text-[var(--primary)] break-all">
              {courseId}
            </code>
          </p>

          <Link
            to="/app/courses"
            className="mt-6 inline-flex rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-semibold text-[var(--primary-contrast)] hover:bg-[var(--hover-primary)] hover:text-[var(--hover-primary-contrast)] transition"
          >
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="min-h-screen p-6 bg-[var(--surface)]" />;
  }

  const courseColor = course.color || "#3B82F6";
  const courseTerm = course.term || "—";

  return (
    <Card>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: courseColor }}
              />
              <span className="text-sm font-semibold text-[var(--muted-text)]">
                {course.code}
              </span>
            </div>

            <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-text-2)]">
              {courseTerm}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text)] break-words">
            {course.code} — {course.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/app/courses"
              className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-text)] shadow-sm hover:bg-slate-50"
            >
              ← Back to Courses
            </Link>

            <button
              onClick={openAdd}
              className="inline-flex items-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm hover:bg-[var(--hover-primary)]"
            >
              + Add Assignment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-text-2)]">
              Study Progress
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-lg font-bold text-[var(--text)]">
                {formatMinutesToHoursMinutes(weeklyStudyTime)}{" "}
                <span className="text-sm font-medium text-[var(--muted-text-2)]">
                  / {formatMinutesToHoursMinutes(course.weeklyGoalMinutes)} goal
                </span>
              </p>
              <p className="text-sm font-semibold text-[var(--muted-text)] ">
                {weeklyStudyPct}%
              </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--muted-text)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out"
                style={{ width: `${weeklyStudyPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-text-2)]">
              Next Due
            </p>
            {nextDue ? (
              <>
                <p className="mt-2 text-lg font-bold text-[var(--text)]">
                  {nextDue.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-text)]">
                    {fmtDate(nextDue.dueDate)}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {dueLabel(nextDue.dueDate)}
                  </span>
                  <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-text)]">
                    Est:{" "}
                    {formatMinutesToHoursMinutes(nextDue.estimatedMinutes || 0)}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted-text)]">
                No upcoming assignments.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-text-2)]">
              Upcoming Workload
            </p>
            <p className="mt-2 text-lg font-bold text-[var(--text)]">
              {formatMinutesToHoursMinutes(totalUpcomingMinutes)}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              Total estimated time for unfinished assignments.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <h2 className="text-lg font-bold text-[var(--text)]">
              Assignments
            </h2>
            <div className="text-sm font-semibold text-[var(--muted-text)]">
              {sortedAssignments.length} total
            </div>
          </div>

          {sortedAssignments.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted-text)]">
              No assignments yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {sortedAssignments.map((a) => {
                const pct = progressPct(
                  a.minutesCompleted || 0,
                  a.estimatedMinutes || 0,
                );

                const isLate =
                  a.status !== "done" &&
                  (() => {
                    const [y, m, d] = String(a.dueDate || "")
                      .split("-")
                      .map(Number);
                    if (!y || !m || !d) return false;
                    const due = new Date(Date.UTC(y, m - 1, d));
                    const now = new Date();
                    const todayUTC = new Date(
                      Date.UTC(
                        now.getUTCFullYear(),
                        now.getUTCMonth(),
                        now.getUTCDate(),
                      ),
                    );
                    return due < todayUTC;
                  })();

                return (
                  <li key={a._id} className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-[var(--text)]">
                            {a.title}
                          </h3>

                          <span className={statusPill(a.status)}>
                            {a.status === "not-started"
                              ? "Not started"
                              : a.status === "in-progress"
                                ? "In progress"
                                : "Done"}
                          </span>

                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              isLate
                                ? "bg-red-100 text-red-700"
                                : "bg-[var(--bg)] text-[var(--muted-text)]",
                            ].join(" ")}
                          >
                            {fmtDate(a.dueDate)} • {dueLabel(a.dueDate)}
                          </span>

                          <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-text)]">
                            Est:{" "}
                            {formatMinutesToHoursMinutes(
                              a.estimatedMinutes || 0,
                            )}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm text-[var(--muted-text)]">
                            <span>
                              Progress:{" "}
                              {formatMinutesToHoursMinutes(
                                a.minutesCompleted || 0,
                              )}{" "}
                              /{" "}
                              {formatMinutesToHoursMinutes(
                                a.estimatedMinutes || 0,
                              )}
                            </span>
                            <span className="font-semibold text-[var(--muted-text)]">
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[var(--primary)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {a.notes?.trim() ? (
                          <p className="mt-2 text-sm text-[var(--muted-text)]">
                            {a.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <button
                          onClick={() => toggleDone(a._id)}
                          className={[
                            "rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition",
                            a.status === "done"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-text)] hover:bg-[var(--bg)]",
                          ].join(" ")}
                        >
                          {a.status === "done" ? "Mark not done" : "Mark done"}
                        </button>

                        <button
                          onClick={() => openEdit(a)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-text)] shadow-sm hover:bg-[var(--bg)]"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteAssignment(a._id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeModal}
            />
            <div className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {mode === "add" ? "Add Assignment" : "Edit Assignment"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-text)]">
                    Enter the details below.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-[var(--muted-text-2)] hover:bg-slate-100 hover:text-[var(--muted-text)]"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--muted-text)]">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Midterm Exam"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-[var(--muted-text)]">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, dueDate: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[var(--muted-text)]">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, status: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="not-started">Not started</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-[var(--muted-text)]">
                      Estimated Minutes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.estimatedMinutes}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          estimatedMinutes: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-[var(--muted-text-2)]">
                      {formatMinutesToHoursMinutes(
                        Number(form.estimatedMinutes || 0),
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[var(--muted-text)]">
                      Completed Minutes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.minutesCompleted}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          minutesCompleted: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--muted-text)]">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes..."
                  />
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--muted-text)] shadow-sm hover:bg-[var(--bg)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAssignment}
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm hover:bg-[var(--hover-primary)]"
                  >
                    {mode === "add" ? "Add" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
