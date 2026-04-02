import { useEffect, useMemo, useRef, useState } from "react";
import { useCourses } from "../hooks/useCourses";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../api/axiosConfig";
import Card from "../components/ui/Card";

const TYPES = ["meeting", "study", "assignment", "event"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toLocalInput(value) {
  if (!value) return "";

  const d = value instanceof Date ? value : new Date(value);

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// function fromLocalInput(value) {
//   if (!value) return null;
//   return new Date(value).toISOString();
// }

function parseCourseTermEnd(termEnd) {
  if (!termEnd) return null;

  const d = new Date(termEnd);
  if (Number.isNaN(d.getTime())) return null;

  d.setHours(23, 59, 59, 999);
  return d;
}

function buildWeeklyRepeatDates(startDate, endDateInclusive) {
  const dates = [];
  const current = new Date(startDate);
  const targetWeekday = startDate.getDay();

  while (current <= endDateInclusive) {
    if (current.getDay() === targetWeekday) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

function shiftDateKeepingTime(baseDate, targetDay) {
  const d = new Date(baseDate);
  d.setFullYear(
    targetDay.getFullYear(),
    targetDay.getMonth(),
    targetDay.getDate(),
  );
  return d;
}

function makeSeriesId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateOnly(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded border border-[var(--border)] px-2 py-1 text-[var(--text)]">
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function SimpleCalendar() {
  const calRef = useRef(null);
  const { courses } = useCourses();

  const courseColors = useMemo(() => {
    const map = {};
    for (const c of courses) {
      map[c._id] = c.color || "#3b82f6";
    }
    return map;
  }, [courses]);

  const courseTermEnds = useMemo(() => {
    const map = {};
    for (const c of courses) {
      map[c._id] = c.termEnd;
    }
    return map;
  }, [courses]);

  const courseOptions = useMemo(
    () =>
      courses.map((c) => ({
        id: c._id,
        label: `${c.code} - ${c.name}`,
      })),
    [courses],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [mode, setMode] = useState("create");
  // isMobile viewport size for calendar view + toolbar
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 850);
  const [form, setForm] = useState({
    id: "",
    title: "",
    start: "",
    end: "",
    allDay: false,
    repeating: false,
    courseId: "",
    type: "event",
    notes: "",
    seriesId: null,
  });
  const [originalSeriesId, setOriginalSeriesId] = useState(null);

  const input =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]";

  const refetchCalendar = () => {
    calRef.current?.getApi()?.refetchEvents();
  };

  const closeDeleteModal = () => {
    setConfirmDeleteOpen(false);
  };

  const resetSeriesState = () => {
    setOriginalSeriesId(null);
  };

  // switch to mobile view at 850px and less
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 850;
      setIsMobile(mobile);

      // if calendar isn't loaded, return early
      const calendarApi = calRef.current?.getApi();
      if (!calendarApi) return;

      // change calendar view if mobile
      if (mobile && calendarApi.view.type !== "timeGridDay") {
        calendarApi.changeView("timeGridDay");
      } else if (!mobile && calendarApi.view.type !== "dayGridMonth") {
        calendarApi.changeView("dayGridMonth");
      }
    };

    // attach resize to browser resize event
    window.addEventListener("resize", handleResize);
    handleResize();

    // cleanup event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchEvents = async (info, success, failure) => {
    try {
      const res = await api.get("/events", {
        params: { start: info.startStr, end: info.endStr },
      });

      const rows = Array.isArray(res.data) ? res.data : [];

      success(
        rows.map((ev) => {
          const courseId = ev?.extendedProps?.courseId;
          const color =
            courseId && courseColors[courseId]
              ? courseColors[courseId]
              : undefined;

          return {
            id: ev._id,
            title: ev.title,
            start: ev.start,
            end: ev.end || null,
            allDay: Boolean(ev.allDay),
            extendedProps: {
              ...(ev.extendedProps || {}),
              seriesId: ev.seriesId || null,
            },
            backgroundColor: color,
            borderColor: color,
          };
        }),
      );
    } catch (e) {
      failure(e);
    }
  };

  const openCreate = (info) => {
    setMode("create");
    closeDeleteModal();
    resetSeriesState();

    setForm({
      id: "",
      title: "",
      start: info.start
        ? info.allDay
          ? String(info.startStr || "").slice(0, 10)
          : toLocalInput(info.start)
        : "",
      end: info.end
        ? info.allDay
          ? String(info.endStr || "").slice(0, 10)
          : toLocalInput(info.end)
        : "",
      allDay: !!info.allDay,
      repeating: false,
      courseId: "",
      type: "event",
      notes: "",
      seriesId: null,
    });

    setModalOpen(true);
  };

  const openEdit = (event) => {
    const ext = event.extendedProps || {};
    const seriesId = ext.seriesId || null;

    setMode("edit");
    closeDeleteModal();
    setOriginalSeriesId(seriesId);

    setForm({
      id: event.id,
      title: event.title || "",
      start: event.start
        ? event.allDay
          ? String(event.startStr || "").slice(0, 10)
          : toLocalInput(event.start)
        : "",
      end: event.end
        ? event.allDay
          ? String(event.endStr || "").slice(0, 10)
          : toLocalInput(event.end)
        : "",
      allDay: !!event.allDay,
      repeating: Boolean(seriesId),
      courseId: ext.courseId || "",
      type: ext.type || "event",
      notes: ext.notes || "",
      seriesId,
    });

    setModalOpen(true);
  };

  const buildPayload = ({
    title,
    start,
    end,
    allDay,
    courseId,
    type,
    notes,
    seriesId,
  }) => {
    return {
      title: title.trim(),
      start: allDay ? start : new Date(start).toISOString(),
      end: end ? (allDay ? end : new Date(end).toISOString()) : null,
      allDay: !!allDay,
      seriesId: seriesId || null,
      extendedProps: {
        courseId: courseId || undefined,
        type,
        notes,
      },
    };
  };

  const createWeeklySeriesEvents = async ({
    title,
    start,
    end,
    allDay,
    courseId,
    type,
    notes,
    seriesId,
    skipFirst = false,
  }) => {
    const termEnd = parseCourseTermEnd(courseTermEnds[courseId]);

    if (!termEnd) {
      alert("Invalid course term end.");
      return false;
    }

    const startDate = new Date(start);

    if (Number.isNaN(startDate.getTime())) {
      alert("Invalid start date.");
      return false;
    }

    let endDate = null;
    if (end) {
      endDate = new Date(end);

      if (Number.isNaN(endDate.getTime())) {
        alert("Invalid end date.");
        return false;
      }

      if (!allDay && endDate <= startDate) {
        alert("End time must be after start time.");
        return false;
      }
    }

    let repeatDays = buildWeeklyRepeatDates(startDate, termEnd);

    if (skipFirst) {
      repeatDays = repeatDays.filter((day) => !sameCalendarDay(day, startDate));
    }

    if (!repeatDays.length) {
      return true;
    }

    const events = repeatDays.map((day) => {
      if (allDay) {
        const dateStr = formatDateOnly(day);

        return buildPayload({
          title,
          start: dateStr,
          end: end ? dateStr : null,
          allDay,
          courseId,
          type,
          notes,
          seriesId,
        });
      }

      const eventStart = shiftDateKeepingTime(startDate, day);
      const eventEnd = endDate ? shiftDateKeepingTime(endDate, day) : null;

      return buildPayload({
        title,
        start: eventStart,
        end: eventEnd,
        allDay,
        courseId,
        type,
        notes,
        seriesId,
      });
    });

    if (!events.length) return true;

    await api.post("/events/bulk", { events });
    return true;
  };

  const updateSeriesPreservingDates = async () => {
    const res = await api.get("/events", {
      params: { seriesId: originalSeriesId },
    });

    const seriesEvents = Array.isArray(res.data) ? res.data : [];

    if (!seriesEvents.length) return true;

    if (form.allDay) {
      const updates = seriesEvents.map((ev) => {
        const evStart = new Date(ev.start);
        const startDateStr = formatDateOnly(evStart);

        let endDateStr = null;
        if (ev.end) {
          const evEnd = new Date(ev.end);
          endDateStr = formatDateOnly(evEnd);
        }

        return api.put(`/events/${ev._id}`, {
          title: form.title.trim(),
          start: startDateStr,
          end: endDateStr,
          allDay: true,
          seriesId: originalSeriesId,
          extendedProps: {
            courseId: form.courseId || undefined,
            type: form.type,
            notes: form.notes,
          },
        });
      });

      await Promise.all(updates);
      return true;
    }

    const editedStart = new Date(form.start);
    const editedEnd = form.end ? new Date(form.end) : null;

    if (Number.isNaN(editedStart.getTime())) {
      alert("Invalid start date.");
      return false;
    }

    if (editedEnd && Number.isNaN(editedEnd.getTime())) {
      alert("Invalid end date.");
      return false;
    }

    const startHours = editedStart.getHours();
    const startMinutes = editedStart.getMinutes();

    const endHours = editedEnd ? editedEnd.getHours() : null;
    const endMinutes = editedEnd ? editedEnd.getMinutes() : null;

    const updates = seriesEvents.map((ev) => {
      const evStart = new Date(ev.start);
      evStart.setHours(startHours, startMinutes, 0, 0);

      let evEnd = null;
      if (editedEnd) {
        evEnd = ev.end ? new Date(ev.end) : new Date(ev.start);
        evEnd.setHours(endHours, endMinutes, 0, 0);
      }

      return api.put(`/events/${ev._id}`, {
        title: form.title.trim(),
        start: evStart.toISOString(),
        end: evEnd ? evEnd.toISOString() : null,
        allDay: false,
        seriesId: originalSeriesId,
        extendedProps: {
          courseId: form.courseId || undefined,
          type: form.type,
          notes: form.notes,
        },
      });
    });

    await Promise.all(updates);
    return true;
  };

  const handleEventMove = async (info) => {
    const event = info.event;
    const ext = event.extendedProps || {};
    const seriesId = ext.seriesId || null;

    try {
      if (seriesId) {
        const res = await api.get("/events", {
          params: { seriesId },
        });

        const seriesEvents = Array.isArray(res.data) ? res.data : [];

        if (event.allDay) {
          const updates = seriesEvents.map((ev) => {
            const evStart = new Date(ev.start);
            const startDateStr = formatDateOnly(evStart);

            let endDateStr = null;
            if (ev.end) {
              const evEnd = new Date(ev.end);
              endDateStr = formatDateOnly(evEnd);
            }

            return api.put(`/events/${ev._id}`, {
              title: ev.title,
              start: startDateStr,
              end: endDateStr,
              allDay: true,
              seriesId,
              extendedProps: {
                ...(ev.extendedProps || {}),
              },
            });
          });

          await Promise.all(updates);
          refetchCalendar();
          return;
        }

        const movedStart = event.start ? new Date(event.start) : null;
        const movedEnd = event.end ? new Date(event.end) : null;

        if (!movedStart || Number.isNaN(movedStart.getTime())) {
          info.revert();
          return;
        }

        const startHours = movedStart.getHours();
        const startMinutes = movedStart.getMinutes();
        const endHours = movedEnd ? movedEnd.getHours() : null;
        const endMinutes = movedEnd ? movedEnd.getMinutes() : null;

        const updates = seriesEvents.map((ev) => {
          const evStart = new Date(ev.start);
          evStart.setHours(startHours, startMinutes, 0, 0);

          let evEnd = null;
          if (movedEnd) {
            evEnd = ev.end ? new Date(ev.end) : new Date(ev.start);
            evEnd.setHours(endHours, endMinutes, 0, 0);
          }

          return api.put(`/events/${ev._id}`, {
            title: ev.title,
            start: evStart.toISOString(),
            end: evEnd ? evEnd.toISOString() : null,
            allDay: false,
            seriesId,
            extendedProps: {
              ...(ev.extendedProps || {}),
            },
          });
        });

        await Promise.all(updates);
        refetchCalendar();
        return;
      }

      await api.put(`/events/${event.id}`, {
        title: event.title,
        start: event.allDay
          ? String(event.startStr || "").slice(0, 10)
          : event.start?.toISOString(),
        end: event.end
          ? event.allDay
            ? String(event.endStr || "").slice(0, 10)
            : event.end.toISOString()
          : null,
        allDay: !!event.allDay,
        seriesId: null,
        extendedProps: {
          courseId: ext.courseId || undefined,
          type: ext.type || "event",
          notes: ext.notes || "",
        },
      });

      refetchCalendar();
    } catch (err) {
      console.error(err);
      info.revert();
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    if (mode === "edit") {
      if (originalSeriesId && form.repeating) {
        const ok = await updateSeriesPreservingDates();
        if (!ok) return;

        closeDeleteModal();
        resetSeriesState();
        setModalOpen(false);
        refetchCalendar();
        return;
      }

      if (originalSeriesId && !form.repeating) {
        const singlePayload = buildPayload({
          title: form.title,
          start: form.start,
          end: form.end,
          allDay: form.allDay,
          courseId: form.courseId,
          type: form.type,
          notes: form.notes,
          seriesId: null,
        });

        await api.delete(`/events/series/${originalSeriesId}`);
        await api.post("/events", singlePayload);

        closeDeleteModal();
        resetSeriesState();
        setModalOpen(false);
        refetchCalendar();
        return;
      }

      if (!originalSeriesId && form.repeating) {
        if (!form.courseId) {
          alert("Pick a course so we know when the semester ends.");
          return;
        }

        if (!form.start) {
          alert("Pick a start date.");
          return;
        }

        const newSeriesId = makeSeriesId();

        const currentPayload = buildPayload({
          title: form.title,
          start: form.start,
          end: form.end,
          allDay: form.allDay,
          courseId: form.courseId,
          type: form.type,
          notes: form.notes,
          seriesId: newSeriesId,
        });

        await api.put(`/events/${form.id}`, currentPayload);

        const ok = await createWeeklySeriesEvents({
          title: form.title,
          start: form.start,
          end: form.end,
          allDay: form.allDay,
          courseId: form.courseId,
          type: form.type,
          notes: form.notes,
          seriesId: newSeriesId,
          skipFirst: true,
        });

        if (!ok) return;

        closeDeleteModal();
        resetSeriesState();
        setModalOpen(false);
        refetchCalendar();
        return;
      }

      const singlePayload = buildPayload({
        title: form.title,
        start: form.start,
        end: form.end,
        allDay: form.allDay,
        courseId: form.courseId,
        type: form.type,
        notes: form.notes,
        seriesId: null,
      });

      await api.put(`/events/${form.id}`, singlePayload);

      closeDeleteModal();
      resetSeriesState();
      setModalOpen(false);
      refetchCalendar();
      return;
    }

    if (form.repeating) {
      if (!form.courseId) {
        alert("Pick a course so we know when the semester ends.");
        return;
      }

      if (!form.start) {
        alert("Pick a start date.");
        return;
      }

      const newSeriesId = makeSeriesId();

      const firstPayload = buildPayload({
        title: form.title,
        start: form.start,
        end: form.end,
        allDay: form.allDay,
        courseId: form.courseId,
        type: form.type,
        notes: form.notes,
        seriesId: newSeriesId,
      });

      await api.post("/events", firstPayload);

      const ok = await createWeeklySeriesEvents({
        title: form.title,
        start: form.start,
        end: form.end,
        allDay: form.allDay,
        courseId: form.courseId,
        type: form.type,
        notes: form.notes,
        seriesId: newSeriesId,
        skipFirst: true,
      });

      if (!ok) return;

      closeDeleteModal();
      resetSeriesState();
      setModalOpen(false);
      refetchCalendar();
      return;
    }

    const payload = buildPayload({
      title: form.title,
      start: form.start,
      end: form.end,
      allDay: form.allDay,
      courseId: form.courseId,
      type: form.type,
      notes: form.notes,
      seriesId: null,
    });

    await api.post("/events", payload);
    closeDeleteModal();
    resetSeriesState();
    setModalOpen(false);
    refetchCalendar();
  };

  const handleDelete = async () => {
    if (!form.id) return;

    if (form.seriesId) {
      setConfirmDeleteOpen(true);
      return;
    }

    await api.delete(`/events/${form.id}`);
    closeDeleteModal();
    resetSeriesState();
    setModalOpen(false);
    refetchCalendar();
  };

  const handleDeleteOne = async () => {
    if (!form.id) return;

    await api.delete(`/events/${form.id}`);
    closeDeleteModal();
    resetSeriesState();
    setModalOpen(false);
    refetchCalendar();
  };

  const handleDeleteAll = async () => {
    if (!form.seriesId) return;

    await api.delete(`/events/series/${form.seriesId}`);
    closeDeleteModal();
    resetSeriesState();
    setModalOpen(false);
    refetchCalendar();
  };

  return (
    <Card>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        // initial view depends on vierport size
        initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
        headerToolbar={
          isMobile
            ? {
                left: "prev,next",
                center: "title",
                right: "timeGridDay,timeGridWeek",
              }
            : {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }
        }
        height={isMobile ? "auto" : "70vh"}
        timeZone="local"
        selectable
        editable
        // touch devices press delay to avoid accidental taps
        longPressDelay={500}
        eventLongPressDelay={500}
        events={fetchEvents}
        displayEventTime={true}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        select={(info) => {
          info.view.calendar.unselect();
          openCreate(info);
        }}
        eventClick={(info) => {
          openEdit(info.event);
        }}
        eventDrop={handleEventMove}
        eventResize={handleEventMove}
      />

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Add item" : "Edit item"}
        onClose={() => {
          setModalOpen(false);
          closeDeleteModal();
          resetSeriesState();
        }}>
        <div className="space-y-3">
          <input
            className={input}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />

          <select
            className={input}
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className={input}
            value={form.courseId}
            onChange={(e) =>
              setForm((p) => ({ ...p, courseId: e.target.value }))
            }>
            <option value="">No course</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-4 text-[var(--text)]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    allDay: e.target.checked,
                  }))
                }
              />
              All day
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.repeating}
                onChange={(e) =>
                  setForm((p) => ({ ...p, repeating: e.target.checked }))
                }
              />
              Repeating
            </label>
          </div>

          {mode === "create" && form.repeating && (
            <p className="text-sm text-[var(--muted-text)]">
              Repeats weekly on the same day until the course semester ends.
            </p>
          )}

          <input
            type={form.allDay ? "date" : "datetime-local"}
            className={input}
            value={form.start || ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                start: e.target.value,
              }))
            }
          />

          <input
            type={form.allDay ? "date" : "datetime-local"}
            className={input}
            value={form.end || ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                end: e.target.value,
              }))
            }
          />

          <textarea
            rows={3}
            className={input}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-2">
            {mode === "edit" && (
              <button
                onClick={handleDelete}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text)]">
                Delete
              </button>
            )}

            <button
              onClick={() => {
                setModalOpen(false);
                closeDeleteModal();
                resetSeriesState();
              }}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text)]">
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--primary)] px-3 py-2 text-[var(--primaryText)]">
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmDeleteOpen}
        title="Delete occurrences?"
        onClose={closeDeleteModal}>
        <div className="space-y-3">
          <p className="text-[var(--text)]">
            This is a repeating event. Do you want to delete all occurrences?
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleDeleteOne}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text)]">
              No
            </button>

            <button
              onClick={handleDeleteAll}
              className="rounded-lg bg-[var(--primary)] px-3 py-2 text-[var(--primaryText)]">
              Yes
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default SimpleCalendar;
