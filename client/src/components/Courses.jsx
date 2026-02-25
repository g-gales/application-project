import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const NEW_TERM_VALUE = "__new__";

const Courses = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch("/mockCourses.json")
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }, []);

  const minutesToHhMm = (mins) => {
    const total = Number(mins || 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}h ${m}m`;
  };

  const fmtDueShort = (yyyyMmDd) => {
    if (!yyyyMmDd) return "—";
    const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const fmtIsoShort = (yyyyMmDd) => {
    if (!yyyyMmDd) return "—";
    const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const getNextDue = (assignments = []) => {
    const upcoming = (assignments || [])
      .filter((a) => a && a.status !== "done" && a.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

    const next = upcoming[0];
    if (!next) return { title: "None", date: "—" };
    return { title: next.title || "Untitled", date: fmtDueShort(next.dueDate) };
  };

  const terms = useMemo(() => {
    const map = new Map();
    (courses || []).forEach((c) => {
      const t = String(c?.term || "").trim();
      if (!t) return;
      if (!map.has(t)) {
        map.set(t, {
          term: t,
          termStart: c?.termStart || "",
          termEnd: c?.termEnd || "",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const as = String(a.termStart || "");
      const bs = String(b.termStart || "");
      if (as && bs && as !== bs) return bs.localeCompare(as);
      return String(a.term).localeCompare(String(b.term));
    });
  }, [courses]);

  const makeBlankForm = () => {
    const defaultTermSelect = terms.length ? terms[0].term : NEW_TERM_VALUE;
    const selected = terms.find((t) => t.term === defaultTermSelect);

    return {
      id: null,
      code: "",
      name: "",
      color: "#3B82F6",
      weeklyGoalMinutes: 120,

      termSelect: defaultTermSelect,
      term: "",
      termStart: selected?.termStart || "",
      termEnd: selected?.termEnd || "",
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [form, setForm] = useState(() => makeBlankForm());
  const [error, setError] = useState("");

  useEffect(() => {
    if (isModalOpen) return;
    setForm(makeBlankForm());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms.length]);

  const openAddCourse = () => {
    setMode("add");
    setForm(makeBlankForm());
    setError("");
    setIsModalOpen(true);
  };

  const openEditCourse = (course) => {
    const termName = String(course?.term || "").trim();
    const exists = terms.some((t) => t.term === termName);

    setMode("edit");
    setForm({
      id: course.id,
      code: course.code || "",
      name: course.name || "",
      color: course.color || "#3B82F6",
      weeklyGoalMinutes: Number(course.weeklyGoalMinutes || 120),

      termSelect: exists ? termName : NEW_TERM_VALUE,
      term: exists ? "" : termName,
      termStart: course.termStart || "",
      termEnd: course.termEnd || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(makeBlankForm());
    setError("");
  };

  const makeId = () => `course-${Math.random().toString(16).slice(2)}-${Date.now()}`;

  const isValidIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

  const validateCourseForm = () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const weeklyGoalMinutes = Number(form.weeklyGoalMinutes);

    const usingNewTerm = form.termSelect === NEW_TERM_VALUE;

    const term = usingNewTerm ? form.term.trim() : String(form.termSelect || "").trim();
    const termStart = String(form.termStart || "").trim();
    const termEnd = String(form.termEnd || "").trim();

    if (!code) return "Course code is required (e.g., INFO-5139).";
    if (!name) return "Course name is required.";

    if (!term) return "Term name is required (e.g., Winter 2026).";
    if (!termStart || !termEnd) return "Term start and end dates are required.";
    if (!isValidIsoDate(termStart) || !isValidIsoDate(termEnd)) return "Term dates must be YYYY-MM-DD.";
    if (termStart > termEnd) return "Term start must be on/before term end.";

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) return "Pick a valid color.";
    if (Number.isNaN(weeklyGoalMinutes) || weeklyGoalMinutes <= 0)
      return "Weekly goal minutes must be greater than 0.";

    const duplicate = courses.some((c) => {
      if (mode === "edit" && c.id === form.id) return false;
      return String(c.code).toLowerCase() === code.toLowerCase();
    });
    if (duplicate) return "That course code already exists.";

    return "";
  };

  const saveCourse = () => {
    const msg = validateCourseForm();
    if (msg) return setError(msg);
    setError("");

    const usingNewTerm = form.termSelect === NEW_TERM_VALUE;

    const cleaned = {
      code: form.code.trim(),
      name: form.name.trim(),
      color: form.color,
      weeklyGoalMinutes: Number(form.weeklyGoalMinutes),

      term: usingNewTerm ? form.term.trim() : String(form.termSelect || "").trim(),
      termStart: String(form.termStart || "").trim(),
      termEnd: String(form.termEnd || "").trim(),
    };

    if (mode === "add") {
      const newCourse = {
        id: makeId(),
        ...cleaned,
        studyMinutesThisWeek: 0,
        meetings: [],
        assignments: [],
      };
      setCourses((prev) => [newCourse, ...(prev || [])]);
      closeModal();
      return;
    }

    setCourses((prev) =>
      (prev || []).map((c) => {
        if (c.id !== form.id) return c;
        return {
          ...c,
          ...cleaned,
          studyMinutesThisWeek: Number(c.studyMinutesThisWeek || 0),
          meetings: Array.isArray(c.meetings) ? c.meetings : [],
          assignments: Array.isArray(c.assignments) ? c.assignments : [],
        };
      })
    );
    closeModal();
  };

  const handleRemoveCourse = (id) => {
    const ok = window.confirm("Remove this course? This can't be undone.");
    if (!ok) return;
    setCourses((prev) => (prev || []).filter((c) => c.id !== id));
  };

  const viewCourses = useMemo(() => {
    return (courses || []).map((c) => {
      const next = getNextDue(c.assignments || []);
      return { ...c, nextDueTitle: next.title, nextDueDate: next.date };
    });
  }, [courses]);

  const usingNewTerm = form.termSelect === NEW_TERM_VALUE;
  const selectedExistingTerm = !usingNewTerm ? terms.find((t) => t.term === form.termSelect) : null;

  const onChangeTermSelect = (value) => {
    if (value === NEW_TERM_VALUE) {
      setForm((p) => ({
        ...p,
        termSelect: NEW_TERM_VALUE,
      }));
      return;
    }

    const t = terms.find((x) => x.term === value);
    setForm((p) => ({
      ...p,
      termSelect: value,
      term: "",
      termStart: t?.termStart || "",
      termEnd: t?.termEnd || "",
    }));
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <button
            onClick={openAddCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            + Add Course
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {viewCourses.map((course) => {
            const pct = Math.min(
              100,
              Math.round(
                (Number(course.studyMinutesThisWeek || 0) / Number(course.weeklyGoalMinutes || 1)) * 100
              )
            );

            return (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition hover:shadow-lg hover:border-gray-300"
              >
                <Link
                  to={`/courses/${course.id}`}
                  className="block p-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Open ${course.code} ${course.name}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                        <div>
                          <div className="text-sm font-semibold text-gray-700">{course.code}</div>
                          <h2 className="text-base sm:text-lg font-bold text-gray-900">{course.name}</h2>
                          <p className="text-sm text-gray-600">
                            {course.term || "—"}{" "}
                            <span className="text-gray-400">
                              ({fmtIsoShort(course.termStart)} → {fmtIsoShort(course.termEnd)})
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-col sm:flex-row items-baseline sm:justify-between">
                          <div className="text-sm text-gray-600">
                            Study This Week:{" "}
                            <span className="font-medium text-gray-800">
                              {minutesToHhMm(course.studyMinutesThisWeek)}
                            </span>{" "}
                            / {minutesToHhMm(course.weeklyGoalMinutes)} goal
                          </div>
                          <div className="text-sm text-gray-500 mt-2 sm:mt-0">{pct}%</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mt-2 overflow-hidden">
                          <div className="h-2 sm:h-3 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-gray-700">
                        <span className="font-medium">Next Due:</span> {course.nextDueTitle} – {course.nextDueDate}
                      </div>
                    </div>

                    <div
                      className="flex-shrink-0 flex gap-2 sm:flex-col sm:gap-3 sm:ml-4 ml-0 mt-4 sm:mt-0"
                      onClick={(e) => e.preventDefault()}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditCourse(course);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition flex items-center justify-center border border-green-600/40"
                        title="Edit"
                      >
                        ✎
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCourse(course.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition flex items-center justify-center border border-red-600/40"
                        title="Remove"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {viewCourses.length === 0 && (
          <div className="rounded-lg shadow-md p-12 text-center bg-white border border-gray-200">
            <p className="text-gray-600 text-lg">No courses enrolled yet.</p>
            <button
              onClick={openAddCourse}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg mt-4 transition"
            >
              + Add Course
            </button>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          {/* ✅ Modal box background restored */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{mode === "add" ? "Add Course" : "Edit Course"}</h3>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Course Code</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., INFO-5139"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Term</label>
                  <select
                    value={form.termSelect}
                    onChange={(e) => onChangeTermSelect(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {terms.length ? (
                      <>
                        {terms.map((t) => (
                          <option key={t.term} value={t.term}>
                            {t.term}
                          </option>
                        ))}
                        <option value={NEW_TERM_VALUE}>+ Add new term…</option>
                      </>
                    ) : (
                      <option value={NEW_TERM_VALUE}>Add your first term…</option>
                    )}
                  </select>

                  {!usingNewTerm && selectedExistingTerm?.termStart && selectedExistingTerm?.termEnd ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Dates: {fmtIsoShort(selectedExistingTerm.termStart)} → {fmtIsoShort(selectedExistingTerm.termEnd)}
                    </p>
                  ) : null}
                </div>
              </div>

              {usingNewTerm ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">New Term Name</label>
                    <input
                      value={form.term}
                      onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Winter 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Term Start</label>
                      <input
                        type="date"
                        value={form.termStart}
                        onChange={(e) => setForm((p) => ({ ...p, termStart: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Term End</label>
                      <input
                        type="date"
                        value={form.termEnd}
                        onChange={(e) => setForm((p) => ({ ...p, termEnd: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-slate-700">Course Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Internet Applications"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Weekly Goal (minutes)</label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={form.weeklyGoalMinutes}
                    onChange={(e) => setForm((p) => ({ ...p, weeklyGoalMinutes: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">({minutesToHhMm(form.weeklyGoalMinutes)} per week)</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Color</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1"
                      aria-label="Pick a color"
                    />
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: form.color }} />
                      <code className="text-sm text-slate-700">{String(form.color).toUpperCase()}</code>
                    </div>
                  </div>
                </div>
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
                  onClick={saveCourse}
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
  );
};

export default Courses;