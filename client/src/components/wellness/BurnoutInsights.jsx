import Card from "../ui/Card";

export default function BurnoutInsights({ burnoutRisk }) {
  const { contributors = [] } = burnoutRisk || {};

  return (
    <Card className="p-6 md:p-7">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
            Burnout Insights
          </p>
          <h2 className="text-xl font-extrabold text-[var(--text)]">
            What’s contributing most
          </h2>
          <p className="text-sm text-[var(--muted-text)]">
            These are the patterns currently pushing your burnout risk upward.
          </p>
        </div>

        {contributors.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
            No major burnout contributors detected yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {contributors.map((item) => (
              <li
                key={item.key}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-[var(--text)]">
                        {item.label}
                      </p>
                      <p className="text-xs text-[var(--muted-text-2)]">
                        Impact on current burnout risk
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
                    {item.impact} pts
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
