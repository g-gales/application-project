import Card from "../ui/Card";

const mockRecommendations = [
  {
    id: "recovery-priority",
    title: "Prioritize your Wellness Recovery",
    message:
      "Your stress has increased while sleep has dropped, which can make academic pressure feel harder to manage.",
    suggestions: [
      "Reduce or delay one non-urgent task this week.",
      "Set a stopping point for tonight’s work.",
      "Aim for a full night of sleep before your next heavy study block.",
    ],
    priority: "high",
  },
  {
    id: "backlog-control",
    title: "Focus on Clearing Overdue Work",
    message:
      "You have both urgent upcoming work and overdue tasks, which can quickly increase stress and burnout risk.",
    suggestions: [
      "Choose one overdue task to finish, reduce, or submit today.",
      "Prioritize only the most time-sensitive work for the next 7 days.",
      "Avoid starting lower-priority tasks until overdue work is reduced.",
    ],
    priority: "medium",
  },
];

export default function BurnoutActions({
  burnoutRisk,
  recommendations = [],
  testMode = false,
}) {
  const fallbackActions = burnoutRisk?.actions || [];
  const hasTailoredRecommendations = recommendations.length > 0;
  const activeRecommendations = testMode
    ? mockRecommendations
    : recommendations;

  return (
    <Card title="Suggested Actions" className="p-6 md:p-7">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-[var(--text)]">
            Ways to Lower Your Risk {testMode && "**TEST MODE** "}
          </h2>
          <p className="text-sm text-[var(--muted-text)]">
            These suggestions are based on your recent wellness and workload
            patterns.
          </p>
        </div>

        {!hasTailoredRecommendations && fallbackActions.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted-text)]">
            No immediate actions suggested right now.
          </div>
        ) : hasTailoredRecommendations ? (
          <div className="flex flex-col gap-4">
            {activeRecommendations.map((rec, index) => (
              <div
                key={rec.id || index}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">
                      {rec.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-text)]">
                      {rec.message}
                    </p>
                  </div>

                  {rec.priority && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                        rec.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : rec.priority === "medium"
                            ? "bg-[var(--tertiary)] text-[var(--tertiary-contrast)]"
                            : "bg-[var(--surface-3)] text-[var(--muted-text)]"
                      }`}>
                      {rec.priority}
                    </span>
                  )}
                </div>

                {rec.suggestions?.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-3">
                    {rec.suggestions.map((suggestion, suggestionIndex) => (
                      <li
                        key={suggestionIndex}
                        className="flex items-start gap-3 rounded-[var(--radius)] bg-[var(--surface)] p-3">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-xs font-extrabold text-[var(--primary-contrast)]">
                          {suggestionIndex + 1}
                        </span>

                        <p className="text-sm text-[var(--muted-text)]">
                          {suggestion}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {fallbackActions.map((action, index) => (
              <li
                key={index}
                className="flex items-center  gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
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
