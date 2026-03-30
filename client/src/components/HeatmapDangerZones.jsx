import { useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";
import Card from "./ui/Card";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const HEAT_LEVELS = [
  { bg: "#166534", swatch: "#166534" },
  { bg: "#65a30d", swatch: "#65a30d" },
  { bg: "#f59e0b", swatch: "#f59e0b" },
  { bg: "#dc2626", swatch: "#dc2626" },
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(date) {
  return startOfDay(date).toISOString().split("T")[0];
}

function getDayLabel(date) {
  return DAY_NAMES[date.getDay()];
}

function getDateLabel(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function getDangerLabel(hours) {
  if (hours >= 6) return "High";
  if (hours >= 4) return "Medium";
  if (hours >= 2) return "Medium-Low";
  return "Low";
}

function getHeatIndex(hours) {
  if (hours >= 6) return 3;
  if (hours >= 4) return 2;
  if (hours >= 2) return 1;
  return 0;
}

function calculateHoursForDay(event, dayStart, dayEnd) {
  const eventStart = new Date(event.start);

  let eventEnd;
  if (event.end) {
    eventEnd = new Date(event.end);
  } else if (event.allDay) {
    eventEnd = new Date(endOfDay(eventStart));
  } else {
    eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
  }

  const overlapStart = Math.max(eventStart.getTime(), dayStart.getTime());
  const overlapEnd = Math.min(eventEnd.getTime(), dayEnd.getTime());

  if (overlapEnd <= overlapStart) return 0;

  return (overlapEnd - overlapStart) / (1000 * 60 * 60);
}

const HeatmapDangerZones = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = startOfDay(new Date());
    const rangeStart = today.toISOString();
    const rangeEnd = endOfDay(addDays(today, 6)).toISOString();

    api
      .get("/events", {
        params: {
          start: rangeStart,
          end: rangeEnd,
        },
      })
      .then((res) => {
        setEvents(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error fetching events for heatmap widget:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const next7Days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  const dayData = useMemo(() => {
    return next7Days.map((date) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const totalHours = events.reduce((sum, event) => {
        return sum + calculateHoursForDay(event, dayStart, dayEnd);
      }, 0);

      const roundedHours = Math.round(totalHours * 10) / 10;
      const heatIndex = getHeatIndex(roundedHours);

      return {
        key: formatDateKey(date),
        date,
        dayLabel: getDayLabel(date),
        dateLabel: getDateLabel(date),
        hours: roundedHours,
        dangerLabel: getDangerLabel(roundedHours),
        heatIndex,
        bg: HEAT_LEVELS[heatIndex].bg,
      };
    });
  }, [events, next7Days]);

  return (
    <Card title="Heatmap Danger Zones">
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-[96px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {dayData.map((day) => (
              <div
                key={day.key}
                className="rounded-xl border border-[var(--border)] p-3 min-h-[96px] flex flex-col justify-between text-white"
                style={{ backgroundColor: day.bg }}
                title={`${day.dayLabel} ${day.dateLabel}: ${day.hours} hours`}
              >
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-extrabold text-white">
                    {day.dayLabel}
                  </span>
                  <span className="text-xs text-white/80 mt-0.5">
                    {day.dateLabel}
                  </span>
                </div>

                <div className="text-sm leading-tight text-white">
                  {day.dangerLabel}
                </div>

                <div className="text-[11px] font-mono text-white/80">
                  {day.hours}h
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted-text)]">
            <span>Less</span>

            {HEAT_LEVELS.map((level, index) => (
              <span
                key={index}
                className="w-4 h-4 rounded-[4px] border border-[var(--border)]"
                style={{ backgroundColor: level.swatch }}
                aria-hidden="true"
              />
            ))}

            <span>More</span>
            <span className="ml-1">(Hours of events per day)</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default HeatmapDangerZones;