import { useNavigate } from "react-router-dom";
import Card from "./Card";
import Button from "./Button";
import { FaExternalLinkAlt } from "react-icons/fa";

function getDashboardActions({
  recommendations = [],
  burnoutRisk = {},
  limit = 3,
}) {
  if (recommendations.length > 0) {
    const flattened = recommendations.flatMap((rec) => rec.suggestions || []);
    return [...new Set(flattened)].slice(0, limit);
  }

  return (burnoutRisk.actions || []).slice(0, limit);
}

export default function TodaysFocusCard({
  burnoutRisk = {},
  recommendations = [],
}) {
  const actions = getDashboardActions({
    recommendations,
    burnoutRisk,
    limit: 3,
  });

  const navigate = useNavigate();

  const navigateToWellness = (
    <Button variant="secondary" onClick={() => navigate("/app/wellness")}>
      More Wellness Insights
      <FaExternalLinkAlt />
    </Button>
  );

  return (
    <Card
      title="Wellness Focus"
      className="h-full p-5 md:p-6"
      footer={navigateToWellness}>
      <div className="flex h-full flex-col gap-4">
        {actions.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">
              No urgent action needed
            </p>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              Your current patterns look stable right now.
            </p>
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
