import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function SimpleCalendar() {
  // db mockup data
  const [events, setEvents] = useState([
    {
      id: "65d8f1a2b3c4d5e6f7a8b901",
      title: "Project Sync",
      start: "2026-02-23T10:00:00Z",
      end: "2026-02-23T12:30:00Z",
      extendedProps: {
        courseId: "course-1",
        type: "meeting",
      },
    },
    {
      id: "65d8f1a2b3c4d5e6f7a8b902",
      title: "Study Session",
      start: "2026-02-24T09:00:00Z",
      end: "2026-02-24T17:00:00Z",
      extendedProps: {
        courseId: "course-2",
        type: "study",
      },
    },
  ]);

  // info object comes from FullCalendar:
  // https://fullcalendar.io/docs/moreLinkClick#callback-function
  const handleSelect = (info) => {
    console.log("FullCalendar Info Object:", info);
    // TODO: replace prompt with a modal form to create event
    const title = prompt("Enter event title:");
    if (title) {
      const newEvent = {
        title,
        start: info.startStr,
        end: info.endStr,
        allDay: info.allDay,
        // event types are set in /server/src/models/Event.js
        //["meeting", "study", "assignment", "event"],
        // if not specified "event" is default
        extendedProps: { type: "event" },
      };

      alert(
        `Ready to save to DB:\n\n` +
          `Title: ${newEvent.title}\n` +
          `Start: ${newEvent.start}\n` +
          `Type: ${newEvent.extendedProps.type}`,
      );

      // TODO: save to database here and receive success

      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
  };

  return (
    <div className="w-full max-w-5xl h-[65vh] mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        height="100%" // height and/or width should be explicit here AND in the wrapper div
        selectable={true} // this allows click and drag to select dates
        select={handleSelect}
        eventClick={(clickInfo) => {
          // this will handle clicking on an event
          const { title, start, end } = clickInfo.event;
          alert(
            `Title: ${title}\n` +
              `Starts: ${start.toLocaleString()}\n` +
              `Ends: ${end ? end.toLocaleString() : "N/A"}`,
          );
        }}
      />
    </div>
  );
}

export default SimpleCalendar;
