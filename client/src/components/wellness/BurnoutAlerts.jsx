import Card from "../ui/Card";

const levelStyles = {
  warning:
    "border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
  danger:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200",
  info: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]",
};

function formatDetailValue(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(1);
  }
  return value;
}

export default function BurnoutAlerts({
  alerts = [],
  compact = false,
  testMode = false,
}) {
  const testAlerts = [
    {
      id: "sleep-decline",
      level: "warning",
      title: "Sleep is trending downward",
      message:
        "Your average sleep dropped by 1.4 hours compared to your previous 3 check-ins.",
      action:
        "Aim for 7–8 hours of sleep and reduce late-night workload where possible.",
      details: {
        recentAverage: 5.8,
        previousAverage: 7.2,
        change: -1.4,
        unit: "hours",
      },
    },
    {
      id: "stress-rise",
      level: "warning",
      title: "Stress is trending upward",
      message:
        "Your average stress increased by 1.1 points compared to your previous 3 check-ins.",
      action: "Try adding short recovery breaks or reducing non-urgent tasks.",
      details: {
        recentAverage: 4.0,
        previousAverage: 2.9,
        change: 1.1,
        unit: "points",
      },
    },
    {
      id: "high-burnout",
      level: "danger",
      title: "High burnout risk detected",
      message:
        "Your current wellness and workload patterns suggest a high burnout risk.",
      action: "Reduce pressure where possible and focus on recovery.",
      details: {
        score: 74,
        previousScore: 61,
        change: 13,
        unit: "points",
      },
    },
  ];

  const activeAlerts = testMode ? testAlerts : alerts;

  if (!activeAlerts.length) return null;

  const visibleAlerts = compact ? activeAlerts.slice(0, 1) : activeAlerts;

  return (
    <Card title="Burnout Alerts" className="p-6 md:p-7">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--text)]">
            Attention needed
          </h2>
          <p className="text-sm text-[var(--muted-text)]">
            These warnings appear when your recent wellness or workload trends
            suggest growing burnout risk.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-[var(--radius)] border px-4 py-4 ${levelStyles[alert.level] || levelStyles.info}`}>
              <p className="text-sm font-extrabold">{alert.title}</p>
              <p className="mt-1 text-sm opacity-90">{alert.message}</p>
              {alert.details?.recentAverage !== undefined &&
                alert.details?.previousAverage !== undefined && (
                  <p className="mt-2 text-xs opacity-80">
                    Recent average:{" "}
                    {formatDetailValue(alert.details.recentAverage)}{" "}
                    {alert.details.unit} • Previous average:{" "}
                    {formatDetailValue(alert.details.previousAverage)}{" "}
                    {alert.details.unit}
                  </p>
                )}

              {alert.details?.score !== undefined && (
                <p className="mt-2 text-xs opacity-80">
                  Current score: {formatDetailValue(alert.details.score)}
                  {alert.details.previousScore !== undefined && (
                    <>
                      {" "}
                      • Previous score:{" "}
                      {formatDetailValue(alert.details.previousScore)}
                    </>
                  )}
                </p>
              )}

              {alert.details?.dueSoonHours !== undefined && (
                <p className="mt-2 text-xs opacity-80">
                  Due soon workload:{" "}
                  {formatDetailValue(alert.details.dueSoonHours)} hours
                </p>
              )}

              {alert.details?.overdueCount !== undefined && (
                <p className="mt-2 text-xs opacity-80">
                  Overdue assignments:{" "}
                  {formatDetailValue(alert.details.overdueCount)}
                  {alert.details.overdueHours !== undefined && (
                    <>
                      {" "}
                      • Remaining work:{" "}
                      {formatDetailValue(alert.details.overdueHours)} hours
                    </>
                  )}
                </p>
              )}
              {alert.action && (
                <p className="mt-2 text-sm font-medium">
                  Suggested response: {alert.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
