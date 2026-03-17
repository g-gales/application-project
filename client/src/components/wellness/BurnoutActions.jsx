import Card from "../ui/Card";

export default function BurnoutActions({ burnoutRisk }) {
  const { actions = [] } = burnoutRisk || {};

  return (
    <Card className="p-6 md:p-7">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
            Suggested Actions
          </p>
          <h2 className="text-xl font-extrabold text-[var(--text)]">
            Ways to lower your risk
          </h2>
          <p className="text-sm text-[var(--muted-text)]">
            These suggestions are based on your recent wellness and workload
            patterns.
          </p>
        </div>

        {actions.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
            No immediate actions suggested right now.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {actions.map((action, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-xs font-extrabold text-[var(--primary-contrast)]">
                  {index + 1}
                </span>

                <p className="text-sm text-[var(--muted-text)]">{action}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
