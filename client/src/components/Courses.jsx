import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { useCourses } from "../hooks/useCourses";
import { useWeeklyStudySummary } from "../hooks/useWeeklyStudySummary";
import { formatMinutesToHoursMinutes } from "../utils/timeUtils";

import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";

import Card from "../components/ui/Card";
import Button from "./ui/Button";

const getTransparentColor = (hex = "#3B82F6", opacity = 0.1) => {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const NEW_TERM_VALUE = "__new__";

const Courses = () => {
  const { courses, addCourse, updateCourse, deleteCourse, fetchCourses } =
    useCourses();
  const { weeklyStudyMinutesByCourseId } = useWeeklyStudySummary();
  const [assignments, setAssignments] = useState([]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments");
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      setAssignments([]);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const assignmentsByCourseId = useMemo(() => {
    return assignments.reduce((map, assignment) => {
      if (!assignment || !assignment.courseId) return map;
      const list = map.get(assignment.courseId) || [];
      list.push(assignment);
      map.set(assignment.courseId, list);
      return map;
    }, new Map());
  }, [assignments]);

  const totalWeeklyGoals = useMemo(() => {
    const totalMinutes = (courses || []).reduce(
      (sum, course) => sum + Number(course.weeklyGoalMinutes || 0),
      0,
    );

    return formatMinutesToHoursMinutes(totalMinutes);
  }, [courses]);

  const fmtDueShort = useCallback((yyyyMmDd) => {
    if (!yyyyMmDd) return "—";
    const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, []);

  const fmtIsoShort = useCallback((yyyyMmDd) => {
    if (!yyyyMmDd) return "—";
    const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getNextDue = useCallback(
    (assignments = []) => {
      const upcoming = (assignments || [])
        .filter((a) => a && a.status !== "done" && a.dueDate)
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

      const next = upcoming[0];
      if (!next) return { title: "None", date: "—" };
      return {
        title: next.title || "Untitled",
        date: fmtDueShort(next.dueDate),
      };
    },
    [fmtDueShort],
  );

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
  const [selectedTerm, setSelectedTerm] = useState("all");

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
      id: course._id, // add mongo ID
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

  const isValidIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

  const validateCourseForm = () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const weeklyGoalMinutes = Number(form.weeklyGoalMinutes);

    const usingNewTerm = form.termSelect === NEW_TERM_VALUE;

    const term = usingNewTerm
      ? form.term.trim()
      : String(form.termSelect || "").trim();
    const termStart = String(form.termStart || "").trim();
    const termEnd = String(form.termEnd || "").trim();

    if (!code) return "Course code is required (e.g., INFO-5139).";
    if (!name) return "Course name is required.";

    if (!term) return "Term name is required (e.g., Winter 2026).";
    if (!termStart || !termEnd) return "Term start and end dates are required.";
    if (!isValidIsoDate(termStart) || !isValidIsoDate(termEnd))
      return "Term dates must be YYYY-MM-DD.";
    if (termStart > termEnd) return "Term start must be on/before term end.";

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) return "Pick a valid color.";
    if (Number.isNaN(weeklyGoalMinutes) || weeklyGoalMinutes <= 0)
      return "Weekly goal minutes must be greater than 0.";

    const duplicate = courses.some((c) => {
      if (mode === "edit" && c._id === form.id) return false;
      return String(c.code).toLowerCase() === code.toLowerCase();
    });
    if (duplicate) return "That course code already exists.";

    return "";
  };

  const saveCourse = async () => {
    const msg = validateCourseForm();
    if (msg) return setError(msg);
    setError("");

    const usingNewTerm = form.termSelect === NEW_TERM_VALUE;

    // adapting the data for MongoDB
    const cleaned = {
      code: form.code.trim(),
      name: form.name.trim(),
      color: form.color,
      weeklyGoalMinutes: Number(form.weeklyGoalMinutes),

      term: usingNewTerm
        ? form.term.trim()
        : String(form.termSelect || "").trim(),
      termStart: String(form.termStart || "").trim(),
      termEnd: String(form.termEnd || "").trim(),
    };

    try {
      if (mode === "add") {
        const result = await addCourse(cleaned);
        if (!result.success) {
          return setError(
            result.message || "Server Error: Could not save course",
          );
        }
      } else {
        const result = await updateCourse(form.id, cleaned);
        if (!result.success) {
          return setError(
            result.message || "Server Error: Could not save course",
          );
        }

        await fetchCourses();
      }

      closeModal();
    } catch (error) {
      setError(
        error.response?.data?.message || "Server Error: Could not save course",
      );
    }
  };

  const handleRemoveCourse = async (id) => {
    if (!window.confirm("Remove course?")) return;

    const result = await deleteCourse(id);
    if (!result.success) {
      console.error(result.message);
      alert(`Delete failed: ${result.message}`);
    }
  };

  const filteredCourses = useMemo(() => {
    if (selectedTerm === "all") return courses || [];
    return (courses || []).filter(
      (course) => String(course.term || "").trim() === selectedTerm,
    );
  }, [courses, selectedTerm]);

  const viewCourses = useMemo(() => {
    return (filteredCourses || []).map((c) => {
      const courseAssignments =
        assignmentsByCourseId.get(c._id) || c.assignments || [];
      const next = getNextDue(courseAssignments);
      return { ...c, nextDueTitle: next.title, nextDueDate: next.date };
    });
  }, [filteredCourses, assignmentsByCourseId, getNextDue]);

  const usingNewTerm = form.termSelect === NEW_TERM_VALUE;
  const selectedExistingTerm = !usingNewTerm
    ? terms.find((t) => t.term === form.termSelect)
    : null;

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
    <Card>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              {courses.length} course{courses.length === 1 ? "" : "s"} · Total
              weekly goals: {totalWeeklyGoals}
            </p>
          </div>

          <button
            onClick={openAddCourse}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--hover-primary)] mt-2">
            + Add Course
          </button>
        </div>

        <div className="mb-6 max-w-sm">
          <label className="space-y-2 block">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
              Filter:
            </span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)]">
              <option value="all">All Terms</option>
              {terms.map((term) => (
                <option key={term.term} value={term.term}>
                  {term.term}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 min-[850px]:grid-cols-2 xl:grid-cols-3 gap-5">
          {viewCourses.map((course) => {
            const weeklyMinutes = weeklyStudyMinutesByCourseId[course._id];
            const studyMinutes = weeklyMinutes || 0;
            const pct = Math.min(
              100,
              Math.round(
                (studyMinutes / Number(course.weeklyGoalMinutes || 1)) * 100,
              ),
            );

            return (
              <div
                key={course._id}
                className="rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  borderColor: getTransparentColor(course.color, 0.5),
                }}>
                <Link
                  to={`/app/courses/${course._id}`}
                  className="block h-full p-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Open ${course.code} ${course.name}`}>
                  <div className="flex flex-col justify-between h-full gap-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        <span className="text-sm font-semibold text-[var(--muted-text)]">
                          {course.code}
                        </span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.1em] text-[var(--muted-text)]">
                        {course.term || "—"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-[var(--text)] leading-tight break-words">
                      {course.name}
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted-text)]">
                          Weekly goal
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                          {formatMinutesToHoursMinutes(
                            course.weeklyGoalMinutes,
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted-text)]">
                          Studied this week
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                          {formatMinutesToHoursMinutes(studyMinutes)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-[var(--muted-text)]">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full rounded-full bg-[var(--tertiary)] h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: course.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-[var(--muted-text)]">
                      <p className="font-medium text-[var(--text)]">Next due</p>
                      <p className="mt-1">
                        {course.nextDueTitle} - {course.nextDueDate}
                      </p>
                    </div>

                    <div
                      className="flex flex-wrap justify-between gap-2"
                      onClick={(e) => e.preventDefault()}>
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditCourse(course);
                        }}
                        title="Edit"
                        variant="green">
                        <FaRegEdit />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCourse(course._id);
                        }}
                        title="Remove"
                        variant="red">
                        <FaRegTrashAlt />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {viewCourses.length === 0 && (
          <div className="rounded-lg shadow-md p-12 text-center bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-[var(--text)] text-lg">
              No courses enrolled yet.
            </p>
            <button
              onClick={openAddCourse}
              className="bg-[var(--primary)] hover:bg-[var(--hover-primary)] text-[var(--primary-contrast)] font-semibold py-2 px-4 rounded-lg mt-4 transition">
              + Add Course
            </button>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          {/* ✅ Modal box background restored */}
          <div className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] p-5 shadow-xl border border-[var(--border)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  {mode === "add" ? "Add Course" : "Edit Course"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[var(--text)]">
                    Course Code
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, code: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., INFO-5139"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--text)]">
                    Term
                  </label>
                  <select
                    value={form.termSelect}
                    onChange={(e) => onChangeTermSelect(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
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
                      <option value={NEW_TERM_VALUE}>
                        Add your first term…
                      </option>
                    )}
                  </select>

                  {!usingNewTerm &&
                  selectedExistingTerm?.termStart &&
                  selectedExistingTerm?.termEnd ? (
                    <p className="mt-1 text-xs text-[var(--muted-text)]">
                      Dates: {fmtIsoShort(selectedExistingTerm.termStart)} →{" "}
                      {fmtIsoShort(selectedExistingTerm.termEnd)}
                    </p>
                  ) : null}
                </div>
              </div>

              {usingNewTerm ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-[var(--text)]">
                      New Term Name
                    </label>
                    <input
                      value={form.term}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, term: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Winter 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-[var(--text)]">
                        Term Start
                      </label>
                      <input
                        type="date"
                        value={form.termStart}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, termStart: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[var(--text)]">
                        Term End
                      </label>
                      <input
                        type="date"
                        value={form.termEnd}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, termEnd: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-[var(--text)]">
                  Course Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Internet Applications"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[var(--text)]">
                    Weekly Goal (minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={form.weeklyGoalMinutes}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        weeklyGoalMinutes: Number(e.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-[var(--muted-text)]">
                    ({formatMinutesToHoursMinutes(form.weeklyGoalMinutes)} per
                    week)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[var(--text)]">
                    Color
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, color: e.target.value }))
                      }
                      className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-[var(--surface)] p-1"
                      aria-label="Pick a color"
                    />
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: form.color }}
                      />
                      <code className="text-sm text-[var(--text)]">
                        {String(form.color).toUpperCase()}
                      </code>
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
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:bg-[var(--surface)]">
                  Cancel
                </button>
                <button
                  onClick={saveCourse}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm hover:bg-[var(--hover-primary)]">
                  {mode === "add" ? "Add" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};

export default Courses;
