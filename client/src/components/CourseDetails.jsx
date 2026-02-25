import React, { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

export default function CourseDetails() {
  const { courseId } = useParams();

  const [mockCourses, setMockCourses] = useState([]);
  useEffect(() => {
    fetch("/mockCourses.json")
      .then((res) => res.json())
      .then((data) => setMockCourses(Array.isArray(data) ? data : []))
      .catch(() => setMockCourses([]));
  }, []);

  const [course, setCourse] = useState(null);

  useEffect(() => {
    const found = mockCourses.find((c) => c.id === courseId) ?? null;
    setCourse(found);
  }, [courseId, mockCourses]);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const minutesToHhMm = (mins) => {
    const total = Number(mins || 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}h ${m}m`;
  };

  const fmtDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return "—";
    const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const diffDays = Math.round((due - todayUTC) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d late`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays}d`;
  };

  const statusPill = (status) => {
    const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
    if (status === "done") return `${base} bg-emerald-100 text-emerald-700`;
    if (status === "in-progress") return `${base} bg-blue-100 text-blue-700`;
    return `${base} bg-slate-100 text-slate-700`;
  };

  const toInputDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const makeId = () => `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;

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

  const weeklyStudyPct = course ? progressPct(course.studyMinutesThisWeek, course.weeklyGoalMinutes) : 0;

  const totalUpcomingMinutes = useMemo(() => {
    if (!course?.assignments) return 0;
    return course.assignments
      .filter((a) => a.status !== "done")
      .reduce((sum, a) => sum + Number(a.estimatedMinutes || 0), 0);
  }, [course]);

  const blankForm = {
    id: "",
    title: "",
    dueDate: "",
    estimatedMinutes: 60,
    minutesCompleted: 0,
    status: "not-started",
    notes: "",
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");

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

  const saveAssignment = () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.dueDate) return setError("Due date is required.");

    const est = Number(form.estimatedMinutes);
    const done = Number(form.minutesCompleted);

    if (Number.isNaN(est) || est < 0) return setError("Estimated minutes must be 0 or more.");
    if (Number.isNaN(done) || done < 0) return setError("Completed minutes must be 0 or more.");

    setError("");

    setCourse((prev) => {
      if (!prev) return prev;
      const assignments = Array.isArray(prev.assignments) ? prev.assignments : [];

      if (mode === "add") {
        const newA = {
          ...form,
          id: makeId(),
          estimatedMinutes: est,
          minutesCompleted: clamp(done, 0, est || done),
        };
        return { ...prev, assignments: [newA, ...assignments] };
      }

      const updated = assignments.map((a) =>
        a.id === form.id
          ? {
              ...a,
              ...form,
              estimatedMinutes: est,
              minutesCompleted: clamp(done, 0, est || done),
            }
          : a
      );

      return { ...prev, assignments: updated };
    });

    closeModal();
  };

  const deleteAssignment = (id) => {
    const ok = window.confirm("Delete this assignment? This can't be undone.");
    if (!ok) return;

    setCourse((prev) => {
      if (!prev) return prev;
      return { ...prev, assignments: (prev.assignments ?? []).filter((a) => a.id !== id) };
    });
  };

  const toggleDone = (id) => {
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignments: (prev.assignments ?? []).map((a) => {
          if (a.id !== id) return a;
          return { ...a, status: a.status === "done" ? "not-started" : "done" };
        }),
      };
    });
  };

  const bumpProgress = (id, delta) => {
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignments: (prev.assignments ?? []).map((a) => {
          if (a.id !== id) return a;

          const est = Number(a.estimatedMinutes || 0);
          const next = clamp(Number(a.minutesCompleted || 0) + delta, 0, est || Number.MAX_SAFE_INTEGER);

          let status = a.status;
          if (status !== "done") {
            if (next === 0) status = "not-started";
            else if (est > 0 && next >= est) status = "done";
            else status = "in-progress";
          }

          return { ...a, minutesCompleted: next, status };
        }),
      };
    });
  };

  if (course === null) {
    return (
      <div className="min-h-screen p-6 bg-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Course not found</h1>
          <p className="mt-2 text-sm text-slate-600">That courseId doesn’t match any course in the mock data.</p>

          <Link
            to="/courses"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Courses
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700">Available course IDs:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {mockCourses.map((c) => (
                <li key={c.id}>
                  <code className="rounded bg-slate-100 px-1 py-0.5">{c.id}</code> — {c.code}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="min-h-screen p-6 bg-white" />;
  }

  const courseColor = course.color || "#3B82F6";
  const courseTerm = course.term || "—";

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: courseColor }} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {course.code} — {course.name}
                </h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {courseTerm}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link
                  to="/courses"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  ← Back to Courses
                </Link>

                <button
                  onClick={openAdd}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  + Add Assignment
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Study Progress</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-lg font-bold text-slate-900">
                {minutesToHhMm(course.studyMinutesThisWeek)}{" "}
                <span className="text-sm font-medium text-slate-500">/ {minutesToHhMm(course.weeklyGoalMinutes)} goal</span>
              </p>
              <p className="text-sm font-semibold text-slate-700">{weeklyStudyPct}%</p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${weeklyStudyPct}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Due</p>
            {nextDue ? (
              <>
                <p className="mt-2 text-lg font-bold text-slate-900">{nextDue.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {fmtDate(nextDue.dueDate)}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {dueLabel(nextDue.dueDate)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Est: {minutesToHhMm(nextDue.estimatedMinutes || 0)}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No upcoming assignments.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming Workload</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{minutesToHhMm(totalUpcomingMinutes)}</p>
            <p className="mt-1 text-sm text-slate-600">Total estimated time for unfinished assignments.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold text-slate-900">Assignments</h2>
            <div className="text-sm font-semibold text-slate-600">{sortedAssignments.length} total</div>
          </div>

          {sortedAssignments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600">No assignments yet.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {sortedAssignments.map((a) => {
                const pct = progressPct(a.minutesCompleted || 0, a.estimatedMinutes || 0);

                const isLate =
                  a.status !== "done" &&
                  (() => {
                    const [y, m, d] = String(a.dueDate || "").split("-").map(Number);
                    if (!y || !m || !d) return false;
                    const due = new Date(Date.UTC(y, m - 1, d));
                    const now = new Date();
                    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                    return due < todayUTC;
                  })();

                return (
                  <li key={a.id} className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-slate-900">{a.title}</h3>

                          <span className={statusPill(a.status)}>
                            {a.status === "not-started" ? "Not started" : a.status === "in-progress" ? "In progress" : "Done"}
                          </span>

                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              isLate ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700",
                            ].join(" ")}
                          >
                            {fmtDate(a.dueDate)} • {dueLabel(a.dueDate)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            Est: {minutesToHhMm(a.estimatedMinutes || 0)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>
                              Progress: {minutesToHhMm(a.minutesCompleted || 0)} / {minutesToHhMm(a.estimatedMinutes || 0)}
                            </span>
                            <span className="font-semibold text-slate-700">{pct}%</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {a.notes?.trim() ? <p className="mt-2 text-sm text-slate-600">{a.notes}</p> : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <button
                          onClick={() => bumpProgress(a.id, -15)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          title="Minus 15 minutes"
                        >
                          -15m
                        </button>

                        <button
                          onClick={() => bumpProgress(a.id, 15)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          title="Plus 15 minutes"
                        >
                          +15m
                        </button>

                        <button
                          onClick={() => toggleDone(a.id)}
                          className={[
                            "rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition",
                            a.status === "done"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {a.status === "done" ? "Mark not done" : "Mark done"}
                        </button>

                        <button
                          onClick={() => openEdit(a)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteAssignment(a.id)}
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
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{mode === "add" ? "Add Assignment" : "Edit Assignment"}</h3>
                  <p className="mt-1 text-sm text-slate-600">Enter the details below.</p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Midterm Exam"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="not-started">Not started</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Estimated Minutes</label>
                    <input
                      type="number"
                      min={0}
                      value={form.estimatedMinutes}
                      onChange={(e) => setForm((p) => ({ ...p, estimatedMinutes: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">{minutesToHhMm(Number(form.estimatedMinutes || 0))}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Completed Minutes</label>
                    <input
                      type="number"
                      min={0}
                      value={form.minutesCompleted}
                      onChange={(e) => setForm((p) => ({ ...p, minutesCompleted: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAssignment}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    {mode === "add" ? "Add" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}