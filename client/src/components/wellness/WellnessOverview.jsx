import Card from "../ui/Card";

const riskStyles = {
  Low: {
    badge: "bg-[var(--green-bg)] text-[var(--green-text)]",
    ring: "border-[var(--border)]",
    copy: "You're in a healthy range right now.",
  },
  Moderate: {
    badge: "bg-[var(--tertiary)] text-[var(--tertiary-contrast)]",
    ring: "border-[var(--border)]",
    copy: "A few signs suggest your burnout risk is rising.",
  },
  High: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    ring: "border-red-200 dark:border-red-800",
    copy: "Your current patterns suggest a high burnout risk.",
  },
};

const WellnessOverview = ({ burnoutRisk }) => {
  const { score = 0, level = "Low", contributors = [] } = burnoutRisk || {};
  const topContributors = contributors.slice(0, 2);
  const style = riskStyles[level] || riskStyles.Low;
  return (
    <Card className="p-6 md:p-7">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
              Wellness Overview
            </p>
            <div>
              <h2 className="text-2xl font-extrabold text-[var(--text)]">
                Burnout Risk
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-text)]">
                {style.copy}
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-3 self-start rounded-[var(--radius)] border px-4 py-3 ${style.ring} bg-[var(--surface-2)]`}>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Score
              </span>
              <span className="text-2xl font-extrabold text-[var(--text)]">
                {score}
              </span>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${style.badge}`}>
              {level}
            </span>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-sm font-bold text-[var(--text)]">
            Key contributors
          </p>

          {topContributors.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              No major contributors detected yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {topContributors.map((item) => (
                <span
                  key={item.key}
                  className="rounded-full bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-text)]">
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
export default WellnessOverview;
