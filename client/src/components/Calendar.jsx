import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const JS_TO_DAY = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" };

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODateLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function fromISOToLocalDate(iso) {
  return new Date(`${iso}T00:00:00`);
}
function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function minutesFromHHMM(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}
function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function getMonthGridDates(anchorDate) {
  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const gridStart = startOfWeekMonday(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
function fmtMonthTitle(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function fmtWeekLabel(weekStart) {
  const start = new Date(weekStart);
  const end = addDays(start, 6);
  const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startStr} – ${endStr}, ${start.getFullYear()}`;
}
function fmtDayLabel(iso) {
  const d = fromISOToLocalDate(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function statusBadgeClasses(status) {
  if (status === "done") return "bg-emerald-100 text-emerald-700";
  if (status === "in-progress") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}
function makeId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

const DRAG_MIME = "application/x-calendar-event";

const onDragStartEvent = (e, evt, sourceISO) => {
  e.stopPropagation();
  const payload = { ...evt, sourceISO };
  try {
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
  } catch {
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
  }
  e.dataTransfer.effectAllowed = "move";
};

const parseDragPayload = (e) => {
  const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const onDragOverDay = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
};

export default function Calendar() {
  const [courses, setCourses] = useState([]);

  const moveEventToISO = (payload, targetISO) => {
    if (!payload || !targetISO) return;

    const courseId = payload.courseId;
    if (!courseId) return;

    if (payload.sourceISO && payload.sourceISO === targetISO) return;

    if (payload.type === "assignment") {
      const assignmentId = payload.id;
      if (!assignmentId) return;

      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c;
          const existing = Array.isArray(c.assignments) ? c.assignments : [];
          const updated = existing.map((a) => (a.id === assignmentId ? { ...a, dueDate: targetISO } : a));
          return { ...c, assignments: updated };
        })
      );
      return;
    }

    if (payload.type === "meeting") {
      const meetingId = payload.meetingId;
      if (!meetingId) return;

      if (payload.date) {
        setCourses((prev) =>
          prev.map((c) => {
            if (c.id !== courseId) return c;
            const existing = Array.isArray(c.meetings) ? c.meetings : [];
            const updated = existing.map((m) => (m.id === meetingId ? { ...m, date: targetISO } : m));
            return { ...c, meetings: updated };
          })
        );
        return;
      }

      const sourceISO = payload.sourceISO;
      if (!sourceISO) return;

      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c;
          const existing = Array.isArray(c.meetings) ? c.meetings : [];

          const updated = existing.map((m) => {
            if (m.id !== meetingId) return m;
            const current = Array.isArray(m.skipDates) ? m.skipDates : [];
            if (current.includes(sourceISO)) return m;
            return { ...m, skipDates: [...current, sourceISO] };
          });

          const oneOff = {
            id: makeId("m"),
            date: targetISO,
            start: payload.start,
            end: payload.end,
            location: payload.location || "",
          };

          return { ...c, meetings: [...updated, oneOff] };
        })
      );
    }
  };

  const onDropOnDay = (e, targetISO) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = parseDragPayload(e);
    if (!payload) return;
    moveEventToISO(payload, targetISO);
  };

  const [viewMode, setViewMode] = useState("month");
  const [anchorDate, setAnchorDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [dayModalISO, setDayModalISO] = useState(null);
  const [showAdd, setShowAdd] = useState(null);
  const [dayError, setDayError] = useState("");

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    meeting: null,
    iso: null,
  });

  const [meetingForm, setMeetingForm] = useState({
    courseId: "",
    start: "10:00",
    end: "11:00",
    location: "",
    repeatWeekly: true,
    days: [],
  });

  const [assignmentForm, setAssignmentForm] = useState({
    courseId: "",
    title: "",
    status: "not-started",
    notes: "",
    estimatedMinutes: 60,
  });

  useEffect(() => {
    fetch("/mockCourses.json")
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }, []);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    setShowAdd(null);
    setDayError("");
    if (mode !== "day") setDayModalISO(null);
  };

  const todayISO = toISODateLocal(new Date());

  const weekStart = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(weekStart, i)), [weekStart]);
  const monthGridDates = useMemo(() => getMonthGridDates(anchorDate), [anchorDate]);

  const headerLabel =
    viewMode === "week"
      ? fmtWeekLabel(weekStart)
      : viewMode === "day"
      ? fmtDayLabel(toISODateLocal(anchorDate))
      : fmtMonthTitle(anchorDate);

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setAnchorDate(d);
  };

  const goPrev = () => {
    if (viewMode === "week") setAnchorDate((d) => addDays(d, -7));
    else if (viewMode === "day") setAnchorDate((d) => addDays(d, -1));
    else setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNext = () => {
    if (viewMode === "week") setAnchorDate((d) => addDays(d, 7));
    else if (viewMode === "day") setAnchorDate((d) => addDays(d, 1));
    else setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const getEventsForISO = (iso) => {
    const date = fromISOToLocalDate(iso);
    const dayKey = JS_TO_DAY[date.getDay()];
    const events = [];

    for (const course of courses) {
      const color = course.color || "#3B82F6";
      const meetings = Array.isArray(course.meetings) ? course.meetings : [];
      const termStart = course.termStart ? fromISOToLocalDate(course.termStart) : null;
      const termEnd = course.termEnd ? fromISOToLocalDate(course.termEnd) : null;
      const isInTerm = (!termStart || date >= termStart) && (!termEnd || date <= termEnd);

      for (const m of meetings) {
        const isOneOff = !!m.date && m.date === iso;
        const isRecurring = !!m.day && m.day === dayKey && isInTerm;
        if (!isOneOff && !isRecurring) continue;

        if (isRecurring && !isOneOff) {
          const skipDates = Array.isArray(m.skipDates) ? m.skipDates : [];
          if (skipDates.includes(iso)) continue;
        }

        events.push({
          type: "meeting",
          meetingId: m.id,
          seriesId: m.seriesId || null,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          color,
          start: m.start,
          end: m.end,
          location: m.location || "",
          date: m.date || null,
          day: m.day || null,
        });
      }

      const assignments = Array.isArray(course.assignments) ? course.assignments : [];
      for (const a of assignments) {
        if (!a?.dueDate) continue;
        if (a.dueDate !== iso) continue;
        events.push({
          type: "assignment",
          id: a.id,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          color,
          title: a.title || "Untitled assignment",
          dueDate: a.dueDate,
          status: a.status || "not-started",
          notes: a.notes || "",
          estimatedMinutes: a.estimatedMinutes ?? null,
          minutesCompleted: a.minutesCompleted ?? null,
        });
      }
    }

    events.sort((a, b) => {
      const aM = a.type === "meeting";
      const bM = b.type === "meeting";
      if (aM && bM) return minutesFromHHMM(a.start) - minutesFromHHMM(b.start);
      if (aM && !bM) return -1;
      if (!aM && bM) return 1;
      return (a.title || "").localeCompare(b.title || "");
    });

    return events;
  };

  const monthEventsMap = useMemo(() => {
    const map = new Map();
    for (const d of monthGridDates) {
      const iso = toISODateLocal(d);
      map.set(iso, getEventsForISO(iso));
    }
    return map;
  }, [monthGridDates, courses]);

  const weekEventsMap = useMemo(() => {
    const map = new Map();
    for (const d of weekDates) {
      const iso = toISODateLocal(d);
      map.set(iso, getEventsForISO(iso));
    }
    return map;
  }, [weekDates, courses]);

  const openDayModal = (iso) => {
    setDayModalISO(iso);
    setShowAdd(null);
    setDayError("");

    const dayKey = JS_TO_DAY[fromISOToLocalDate(iso).getDay()];
    const firstCourseId = courses[0]?.id || "";

    setMeetingForm({
      courseId: firstCourseId,
      start: "10:00",
      end: "11:00",
      location: "",
      repeatWeekly: true,
      days: dayKey ? [dayKey] : ["Mon"],
    });

    setAssignmentForm({
      courseId: firstCourseId,
      title: "",
      status: "not-started",
      notes: "",
      estimatedMinutes: 60,
    });
  };

  useEffect(() => {
    if (viewMode !== "day") return;
    const iso = toISODateLocal(anchorDate);
    setDayModalISO(iso);
    setShowAdd(null);
    setDayError("");
    const dayKey = JS_TO_DAY[fromISOToLocalDate(iso).getDay()] || "Mon";
    const firstCourseId = courses[0]?.id || "";
    setMeetingForm((p) => ({
      ...p,
      courseId: p.courseId || firstCourseId,
      repeatWeekly: true,
      days: [dayKey],
    }));
    setAssignmentForm((p) => ({
      ...p,
      courseId: p.courseId || firstCourseId,
    }));
  }, [viewMode, anchorDate, courses]);

  const closeDayModal = () => {
    setDayModalISO(null);
    setShowAdd(null);
    setDayError("");
  };

  const addMeeting = () => {
    if (!dayModalISO) return;
    const courseId = meetingForm.courseId;
    if (!courseId) return setDayError("Pick a course.");
    if (!meetingForm.start || !meetingForm.end) return setDayError("Start/end time required.");
    setDayError("");

    const clickedDay = JS_TO_DAY[fromISOToLocalDate(dayModalISO).getDay()] || "Mon";
    const location = meetingForm.location?.trim() || "";

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const existing = Array.isArray(c.meetings) ? c.meetings : [];

        if (!meetingForm.repeatWeekly) {
          const oneOff = {
            id: makeId("m"),
            date: dayModalISO,
            start: meetingForm.start,
            end: meetingForm.end,
            location,
          };
          return { ...c, meetings: [...existing, oneOff] };
        }

        const pickedDays =
          Array.isArray(meetingForm.days) && meetingForm.days.length > 0 ? meetingForm.days : [clickedDay];

        const seriesId = makeId("s");

        const newMeetings = pickedDays.map((day) => ({
          id: makeId("m"),
          seriesId,
          day,
          start: meetingForm.start,
          end: meetingForm.end,
          location,
          skipDates: [],
        }));

        return { ...c, meetings: [...existing, ...newMeetings] };
      })
    );

    setShowAdd(null);
  };

  const addAssignment = () => {
    if (!dayModalISO) return;
    const courseId = assignmentForm.courseId;
    const title = assignmentForm.title.trim();
    if (!courseId) return setDayError("Pick a course.");
    if (!title) return setDayError("Assignment title is required.");
    setDayError("");

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const existing = Array.isArray(c.assignments) ? c.assignments : [];
        const newAssignment = {
          id: makeId("a"),
          title,
          dueDate: dayModalISO,
          status: assignmentForm.status,
          notes: assignmentForm.notes?.trim() || "",
          estimatedMinutes: Number(assignmentForm.estimatedMinutes) || 0,
          minutesCompleted: 0,
        };
        return { ...c, assignments: [...existing, newAssignment] };
      })
    );

    setShowAdd(null);
    setAssignmentForm((p) => ({ ...p, title: "", notes: "" }));
  };

  const deleteMeetingOneRule = (courseId, meetingId) => {
    if (!courseId || !meetingId) return;
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const existing = Array.isArray(c.meetings) ? c.meetings : [];
        return { ...c, meetings: existing.filter((m) => m.id !== meetingId) };
      })
    );
  };

  const deleteMeetingOccurrence = (courseId, meetingEvent, iso) => {
    if (!courseId || !meetingEvent || !iso) return;

    if (meetingEvent.date) {
      deleteMeetingOneRule(courseId, meetingEvent.meetingId);
      return;
    }

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const existing = Array.isArray(c.meetings) ? c.meetings : [];

        const updated = existing.map((m) => {
          if (m.id !== meetingEvent.meetingId) return m;
          const current = Array.isArray(m.skipDates) ? m.skipDates : [];
          if (current.includes(iso)) return m;
          return { ...m, skipDates: [...current, iso] };
        });

        return { ...c, meetings: updated };
      })
    );
  };

  const openDeleteMeetingModal = (meetingEvent, iso) => {
    setDeleteModal({ open: true, meeting: meetingEvent, iso });
  };

  const closeDeleteMeetingModal = () => {
    setDeleteModal({ open: false, meeting: null, iso: null });
  };

  const EventChip = ({ evt, sourceISO }) => {
    const draggable = !!sourceISO;
    return (
      <div
        draggable={draggable}
        onDragStart={(e) => (draggable ? onDragStartEvent(e, evt, sourceISO) : undefined)}
        onClick={(e) => e.stopPropagation()}
        className={[
          "w-full max-w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 overflow-hidden",
          draggable ? "cursor-grab active:cursor-grabbing" : "",
        ].join(" ")}
        title={
          evt.type === "meeting"
            ? `${evt.courseCode} ${evt.start}-${evt.end} ${evt.courseName}`
            : `${evt.courseCode} Due ${evt.title}`
        }
      >
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: evt.color }} />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-700">
              {evt.courseCode}
              <span className="text-slate-400"> • </span>
              {evt.type === "meeting" ? `${evt.start}-${evt.end}` : "Due"}
            </div>
            <div className="truncate text-xs text-slate-600">{evt.type === "meeting" ? evt.courseName : evt.title}</div>
          </div>
        </div>
      </div>
    );
  };

  const DayDots = ({ events }) => {
    if (!events || events.length === 0) return <div className="h-4" />;
    const maxDots = 6;
    const dots = events.slice(0, maxDots);
    const remaining = Math.max(0, events.length - dots.length);

    return (
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {dots.map((evt, idx) => (
          <span
            key={`${evt.type}-${evt.id || evt.meetingId || idx}`}
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: evt.color }}
            title={evt.type === "meeting" ? `${evt.courseCode} meeting` : `${evt.courseCode} assignment`}
          />
        ))}
        {remaining > 0 ? (
          <span className="ml-0.5 text-[10px] font-semibold text-slate-500">+{remaining}</span>
        ) : null}
      </div>
    );
  };

  const dayModalEvents = dayModalISO ? getEventsForISO(dayModalISO) : [];
  const dayMeetings = dayModalEvents.filter((e) => e.type === "meeting");
  const dayAssignments = dayModalEvents.filter((e) => e.type === "assignment");

  return (
    <div className="min-h-screen p-4 overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
            <p className="mt-1 text-sm text-slate-600">{headerLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => changeViewMode("month")}
                className={[
                  "px-3 py-2 text-sm font-semibold",
                  viewMode === "month" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Month
              </button>
              <button
                onClick={() => changeViewMode("week")}
                className={[
                  "px-3 py-2 text-sm font-semibold",
                  viewMode === "week" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Week
              </button>
              <button
                onClick={() => changeViewMode("day")}
                className={[
                  "px-3 py-2 text-sm font-semibold",
                  viewMode === "day" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Day
              </button>
            </div>

            <button
              onClick={goPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Prev
            </button>
            <button
              onClick={goToday}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Today
            </button>
            <button
              onClick={goNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        </div>

        {viewMode === "day" ? (
          <div className="mt-6">
            {(() => {
              const iso = toISODateLocal(anchorDate);
              const isToday = iso === todayISO;

              return (
                <div
                  className={[
                    "rounded-2xl border bg-white shadow-sm overflow-hidden",
                    isToday ? "border-emerald-400" : "border-slate-200",
                  ].join(" ")}
                >
                  <div className="border-b border-slate-200 p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {fromISOToLocalDate(iso).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Meetings</h4>
                        <button
                          onClick={() => {
                            setShowAdd(showAdd === "meeting" ? null : "meeting");
                            setDayError("");
                          }}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          + Add meeting
                        </button>
                      </div>

                      {showAdd === "meeting" ? (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-slate-700">
                              Course
                              <select
                                value={meetingForm.courseId}
                                onChange={(e) => setMeetingForm((p) => ({ ...p, courseId: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              >
                                {courses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.code} — {c.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs font-semibold text-slate-700">
                              Location
                              <input
                                value={meetingForm.location}
                                onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                placeholder="Optional"
                              />
                            </label>

                            <label className="text-xs font-semibold text-slate-700">
                              Start
                              <input
                                type="time"
                                value={meetingForm.start}
                                onChange={(e) => setMeetingForm((p) => ({ ...p, start: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              />
                            </label>

                            <label className="text-xs font-semibold text-slate-700">
                              End
                              <input
                                type="time"
                                value={meetingForm.end}
                                onChange={(e) => setMeetingForm((p) => ({ ...p, end: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              />
                            </label>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={meetingForm.repeatWeekly}
                                onChange={(e) => setMeetingForm((p) => ({ ...p, repeatWeekly: e.target.checked }))}
                              />
                              Repeat weekly
                            </label>

                            {meetingForm.repeatWeekly ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600">Days:</span>
                                {DAYS.map((d) => {
                                  const active = meetingForm.days.includes(d);
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() =>
                                        setMeetingForm((p) => ({
                                          ...p,
                                          days: active ? p.days.filter((x) => x !== d) : [...p.days, d],
                                        }))
                                      }
                                      className={[
                                        "rounded-lg border px-2 py-1 text-xs font-semibold",
                                        active
                                          ? "border-blue-600 bg-blue-600 text-white"
                                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                      ].join(" ")}
                                    >
                                      {d}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              onClick={() => setShowAdd(null)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addMeeting}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2">
                        {dayMeetings.length === 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            No meetings
                          </div>
                        ) : (
                          dayMeetings.map((evt, idx) => (
                            <div key={`dm-${idx}`} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <EventChip evt={evt} sourceISO={iso} />
                              </div>
                              <button
                                onClick={() => openDeleteMeetingModal(evt, iso)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                title="Delete"
                              >
                                🗑
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Assignments due</h4>
                        <button
                          onClick={() => {
                            setShowAdd(showAdd === "assignment" ? null : "assignment");
                            setDayError("");
                          }}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          + Add assignment
                        </button>
                      </div>

                      {showAdd === "assignment" ? (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-slate-700">
                              Course
                              <select
                                value={assignmentForm.courseId}
                                onChange={(e) => setAssignmentForm((p) => ({ ...p, courseId: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              >
                                {courses.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.code} — {c.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs font-semibold text-slate-700">
                              Status
                              <select
                                value={assignmentForm.status}
                                onChange={(e) => setAssignmentForm((p) => ({ ...p, status: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              >
                                <option value="not-started">Not started</option>
                                <option value="in-progress">In progress</option>
                                <option value="done">Done</option>
                              </select>
                            </label>

                            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                              Title
                              <input
                                value={assignmentForm.title}
                                onChange={(e) => setAssignmentForm((p) => ({ ...p, title: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                placeholder="e.g., Lab 3"
                              />
                            </label>

                            <label className="text-xs font-semibold text-slate-700">
                              Est. minutes
                              <input
                                type="number"
                                min={0}
                                value={assignmentForm.estimatedMinutes}
                                onChange={(e) => setAssignmentForm((p) => ({ ...p, estimatedMinutes: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                              />
                            </label>

                            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                              Notes
                              <textarea
                                value={assignmentForm.notes}
                                onChange={(e) => setAssignmentForm((p) => ({ ...p, notes: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Optional"
                              />
                            </label>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              onClick={() => setShowAdd(null)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addAssignment}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2">
                        {dayAssignments.length === 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            No assignments due
                          </div>
                        ) : (
                          dayAssignments.map((evt, idx) => (
                            <div key={`da-${idx}`} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <EventChip evt={evt} sourceISO={iso} />
                              </div>
                              <span
                                className={[
                                  "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold",
                                  statusBadgeClasses(evt.status),
                                ].join(" ")}
                              >
                                {evt.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {dayError ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                        {dayError}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}

        {viewMode === "week" ? (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-7">
            {weekDates.map((date) => {
              const iso = toISODateLocal(date);
              const isToday = iso === todayISO;
              const dayEvents = weekEventsMap.get(iso) || [];

              return (
                <button
                  key={iso}
                  type="button"
                  onDragOver={onDragOverDay}
                  onDrop={(e) => onDropOnDay(e, iso)}
                  onClick={() => openDayModal(iso)}
                  className={[
                    "cursor-pointer rounded-2xl border bg-white shadow-sm text-left overflow-hidden w-full",
                    "transition hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    isToday ? "border-blue-400" : "border-slate-200",
                  ].join(" ")}
                >
                  <div className="border-b border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">
                        {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      {isToday ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Today
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{iso}</div>
                  </div>

                  <div className="p-3 space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="text-sm text-slate-500">No events</div>
                    ) : (
                      dayEvents.slice(0, 6).map((evt, idx) => (
                        <EventChip key={`${iso}-${idx}`} evt={evt} sourceISO={iso} />
                      ))
                    )}
                    {dayEvents.length > 6 ? (
                      <div className="text-xs font-semibold text-slate-500">+{dayEvents.length - 6} more</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {viewMode === "month" ? (
          <div className="mt-6 w-full max-w-full overflow-hidden">
            <div className="w-full max-w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 min-w-0">
                {DAYS.map((d) => (
                  <div key={d} className="p-2 sm:p-3 text-[11px] sm:text-xs font-bold text-slate-700 min-w-0">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 min-w-0">
                {monthGridDates.map((date) => {
                  const iso = toISODateLocal(date);
                  const inMonth = isSameMonth(date, anchorDate);
                  const isToday = iso === todayISO;
                  const dayEvents = monthEventsMap.get(iso) || [];

                  const visible = dayEvents.slice(0, 3);
                  const remaining = Math.max(0, dayEvents.length - visible.length);

                  return (
                    <button
                      key={iso}
                      type="button"
                      onDragOver={onDragOverDay}
                      onDrop={(e) => onDropOnDay(e, iso)}
                      onClick={() => openDayModal(iso)}
                      className={[
                        "cursor-pointer min-h-[86px] sm:min-h-[110px] w-full text-left border-b border-r border-slate-200 p-2 overflow-hidden min-w-0",
                        "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                        !inMonth ? "bg-slate-50/60 text-slate-400 hover:bg-slate-100/70" : "bg-white hover:bg-blue-50",
                        isToday ? "bg-emerald-50 ring-2 ring-emerald-400" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between min-w-0">
                        <div
                          className={[
                            "text-xs font-bold min-w-0 rounded px-2 py-1",
                            isToday ? "text-emerald-700 font-extrabold" : inMonth ? "text-slate-900" : "text-slate-400",
                          ].join(" ")}
                        >
                          {date.getDate()}
                        </div>
                      </div>

                      <div className="sm:hidden">
                        <DayDots events={dayEvents} />
                      </div>

                      <div className="mt-2 space-y-1 min-w-0 hidden sm:block">
                        {visible.map((evt, idx) => (
                          <EventChip key={`${iso}-${idx}`} evt={evt} sourceISO={iso} />
                        ))}

                        {remaining > 0 ? (
                          <div className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-left text-xs font-semibold text-slate-600 overflow-hidden truncate">
                            +{remaining} more
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {dayModalISO && viewMode !== "day" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDayModal} />

          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">{fmtDayLabel(dayModalISO)}</h3>
              </div>
              <button
                onClick={closeDayModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Meetings</h4>
                  <button
                    onClick={() => {
                      setShowAdd(showAdd === "meeting" ? null : "meeting");
                      setDayError("");
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    + Add meeting
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {dayMeetings.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      No meetings.
                    </div>
                  ) : (
                    dayMeetings.map((m, idx) => (
                      <div key={m.meetingId || `m-${idx}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: m.color }} />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-500">{m.courseCode}</div>
                              <div className="text-sm font-bold text-slate-900">
                                {m.start}–{m.end}
                              </div>
                              <div className="text-sm text-slate-700 truncate">{m.courseName}</div>

                              <div className="mt-1 text-xs text-slate-500">
                                {m.date ? `One-off • ${m.date}` : m.day ? `Recurring • ${m.day}` : ""}
                              </div>

                              {m.location ? <div className="text-xs text-slate-500 truncate">{m.location}</div> : null}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <Link
                              to={`/courses/${m.courseId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Open course
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteMeetingModal(m, dayModalISO);
                              }}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                              title="Delete meeting"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Assignments due</h4>
                  <button
                    onClick={() => {
                      setShowAdd(showAdd === "assignment" ? null : "assignment");
                      setDayError("");
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    + Add assignment
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {dayAssignments.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      No assignments due.
                    </div>
                  ) : (
                    dayAssignments.map((a, idx) => (
                      <div key={a.id || `a-${idx}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-500">{a.courseCode}</div>
                              <div className="text-sm font-bold text-slate-900 truncate">{a.title}</div>
                              {a.estimatedMinutes != null ? (
                                <div className="mt-1 text-xs text-slate-500">Est. {a.estimatedMinutes} min</div>
                              ) : null}
                            </div>
                          </div>

                          <span
                            className={[
                              "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold",
                              statusBadgeClasses(a.status),
                            ].join(" ")}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {dayError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  {dayError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {deleteModal.open && deleteModal.meeting ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDeleteMeetingModal} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-bold text-slate-900">Delete meeting</h3>
              <p className="mt-1 text-sm text-slate-600">
                Do you want to delete only this occurrence, or delete the whole meeting rule?
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: deleteModal.meeting.color }} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {deleteModal.meeting.courseCode} • {deleteModal.meeting.start}–{deleteModal.meeting.end}
                    </div>
                    {deleteModal.meeting.location ? (
                      <div className="mt-1 text-xs text-slate-600 truncate">{deleteModal.meeting.location}</div>
                    ) : null}
                    <div className="mt-1 text-xs text-slate-600">
                      {deleteModal.meeting.date
                        ? `One-off on ${deleteModal.meeting.date}`
                        : deleteModal.meeting.day
                        ? `Recurring on ${deleteModal.meeting.day}`
                        : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    deleteMeetingOccurrence(deleteModal.meeting.courseId, deleteModal.meeting, deleteModal.iso);
                    closeDeleteMeetingModal();
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Delete only this occurrence
                </button>

                <button
                  type="button"
                  onClick={() => {
                    deleteMeetingOneRule(deleteModal.meeting.courseId, deleteModal.meeting.meetingId);
                    closeDeleteMeetingModal();
                  }}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete entire meeting rule
                </button>

                <button
                  type="button"
                  onClick={closeDeleteMeetingModal}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}