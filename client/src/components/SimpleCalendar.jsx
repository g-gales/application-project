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

function fromLocalInput(value) {
  if (!value) return null;

  // Keep this as a real Date -> ISO conversion from local input
  // so the DB stores a proper UTC timestamp.
  const d = new Date(value);
  return d.toISOString();
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-[var(--surface)] p-4 border border-[var(--border)] shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text)]"
            >
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
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({
    id: "",
    title: "",
    start: "",
    end: "",
    allDay: false,
    courseId: "",
    type: "event",
    notes: "",
  });

  const courseOptions = useMemo(
    () =>
      courses.map((c) => ({
        id: c._id,
        label: `${c.code} - ${c.name}`,
      })),
    [courses],
  );

  const refetchCalendar = () => {
    calRef.current?.getApi()?.refetchEvents();
  };

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
            extendedProps: ev.extendedProps || {},
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

    setForm({
      id: "",
      title: "",
      start: info.start ? toLocalInput(info.start) : "",
      end: info.end ? toLocalInput(info.end) : "",
      allDay: !!info.allDay,
      courseId: "",
      type: "event",
      notes: "",
    });

    setModalOpen(true);
  };

  const openEdit = (event) => {
    const ext = event.extendedProps || {};

    setMode("edit");
    setForm({
      id: event.id,
      title: event.title || "",
      start: event.start ? toLocalInput(event.start) : "",
      end: event.end ? toLocalInput(event.end) : "",
      allDay: !!event.allDay,
      courseId: ext.courseId || "",
      type: ext.type || "event",
      notes: ext.notes || "",
    });

    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      start: form.allDay ? form.start : fromLocalInput(form.start),
      end: form.end
        ? form.allDay
          ? form.end
          : fromLocalInput(form.end)
        : null,
      allDay: !!form.allDay,
      extendedProps: {
        courseId: form.courseId || undefined,
        type: form.type,
        notes: form.notes,
      },
    };

    if (mode === "create") {
      await api.post("/events", payload);
    } else {
      await api.put(`/events/${form.id}`, payload);
    }

    setModalOpen(false);
    refetchCalendar();
  };

  const handleDelete = async () => {
    if (!form.id) return;
    await api.delete(`/events/${form.id}`);
    setModalOpen(false);
    refetchCalendar();
  };

  const input =
    "w-full rounded-lg px-3 py-2 border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]";

  return (
    <Card>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="70vh"
        timeZone="local"
        selectable
        editable
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
        eventClick={(info) => openEdit(info.event)}
      />

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Add item" : "Edit item"}
        onClose={() => setModalOpen(false)}
      >
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
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
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
            }
          >
            <option value="">No course</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-[var(--text)]">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) =>
                setForm((p) => ({ ...p, allDay: e.target.checked }))
              }
            />
            All day
          </label>

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
                className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)]"
              >
                Delete
              </button>
            )}

            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)]"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primaryText)]"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default SimpleCalendar;
