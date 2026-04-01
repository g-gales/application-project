import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Card from "../ui/Card";

const trendOptions = {
  mood: {
    label: "Mood",
    dataKey: "mood",
    description: "Track how your mood changes over time.",
    domain: [1, 5],
  },
  stress: {
    label: "Stress",
    dataKey: "stress",
    description: "See whether stress levels are rising or improving.",
    domain: [1, 5],
  },
  sleepHours: {
    label: "Sleep",
    dataKey: "sleepHours",
    description: "Monitor your nightly sleep over recent check-ins.",
    domain: [0, 12],
  },
  focus: {
    label: "Focus",
    dataKey: "focus",
    description: "Track changes in concentration over time.",
    domain: [1, 5],
  },
};

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function WellnessTrends({ wellnessEntries = [] }) {
  const [selectedMetric, setSelectedMetric] = useState("stress");

  const currentOption = trendOptions[selectedMetric];

  const chartData = useMemo(() => {
    return [...wellnessEntries]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((entry) => ({
        date: formatShortDate(entry.date),
        mood: Number(entry.mood || 0),
        stress: Number(entry.stress || 0),
        sleepHours: Number(entry.sleepHours || 0),
        focus: Number(entry.focus || 0),
      }));
  }, [wellnessEntries]);

  return (
    <Card className="p-6 md:p-7">
      <div className="flex flex-col gap-5">
        <div className=" pt-1 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
              Wellness Trends
            </p>
            <h2 className="text-xl font-extrabold text-[var(--text)]">
              {currentOption.label} Over Time
            </h2>
            <p className="text-sm text-[var(--muted-text)]">
              {currentOption.description}
            </p>
          </div>

          <div className="w-full md:w-[220px]">
            <label
              htmlFor="trendMetric"
              className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted-text-2)]">
              Trend type
            </label>
            <select
              id="trendMetric"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text)]">
              {Object.entries(trendOptions).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
            No wellness trend data available yet.
          </div>
        ) : (
          <div className="h-[320px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 md:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-text-2)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={currentOption.domain}
                  stroke="var(--muted-text-2)"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    color: "var(--text)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={currentOption.dataKey}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
