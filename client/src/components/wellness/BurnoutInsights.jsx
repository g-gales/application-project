import Card from "../ui/Card";

export default function BurnoutInsights({ burnoutRisk }) {
  const { contributors = [] } = burnoutRisk || {};

  return (
    <Card title="Burnout Insights" className="p-6 md:p-7" id="insights">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
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
            {contributors.map((item) => {
              const percent =
                item.max > 0 ? Math.round((item.impact / item.max) * 100) : 0;

              const strengthLabel =
                percent >= 75 ? "High" : percent >= 40 ? "Moderate" : "Low";
              return (
                <li
                  key={item.key}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-[var(--text)]">
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--muted-text-2)]">
                          Impact on current burnout risk
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-3">
                      <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--muted-text)]">
                        {strengthLabel}
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="h-4 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between pr-10 text-[11px] text-[var(--muted-text-2)]">
                          <span>{percent}% of max impact</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
