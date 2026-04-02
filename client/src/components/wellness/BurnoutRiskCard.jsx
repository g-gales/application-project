import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";

import Button from "../ui/Button";
import { FaExternalLinkAlt } from "react-icons/fa";

const riskStyles = {
  Low: {
    badge: "bg-[var(--pill-green-bg)] text-[var(--pill-green-text)]",
    ringTrack: "bg-[var(--surface-3)]",
    ringFill: "bg-[var(--green-text)]",
    outline: "border-[var(--border)]",
    copy: "You're in a healthy range right now.",
  },
  Moderate: {
    badge: "bg-[var(--pill-blue-bg)] text-[var(--pill-blue-text)]",
    ringTrack: "bg-[var(--surface-3)]",
    ringFill: "bg-[var(--primary)]",
    outline: "border-[var(--border)]",
    copy: "A few signs suggest your burnout risk is rising.",
  },
  High: {
    badge: "bg-[var(--pill-red-bg)] text-[var(--pill-red-text)]",
    ringTrack: "bg-[var(--surface-3)]",
    ringFill: "bg-[var(--danger)]",
    outline: "border-[var(--danger-text)]",
    copy: "Your current patterns suggest a high burnout risk.",
  },
};

function getTrend(score = 0, previousScore = null) {
  if (previousScore === null || previousScore === undefined) {
    return {
      delta: 0,
      direction: "neutral",
      label: "Not Enough History Yet",
    };
  }

  const delta = score - previousScore;

  if (delta > 0) {
    return {
      delta,
      direction: "up",
      label: `Up ${delta} From Previous Period`,
    };
  }

  if (delta < 0) {
    return {
      delta: Math.abs(delta),
      direction: "down",
      label: `Down ${Math.abs(delta)} From Previous Period`,
    };
  }

  return {
    delta: 0,
    direction: "neutral",
    label: "No Change From Previous Period",
  };
}

function SemiDonutGauge({ score = 0, level = "Low" }) {
  const safeScore = Math.max(0, Math.min(100, score));

  const strokeColor =
    level === "High"
      ? "#ef4444"
      : level === "Moderate"
        ? "var(--primary)"
        : "var(--green-text)";

  const radius = 70;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = Math.PI * normalizedRadius;
  const progress = (safeScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-28 w-56">
        <svg viewBox="0 0 160 90" className="h-full w-full overflow-visible">
          {/* background track */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* progress arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - safeScore}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-[var(--text)]">
            {safeScore}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
            Risk Score
          </span>
        </div>
      </div>
    </div>
  );
}

function TrendPill({ score, previousScore }) {
  const trend = getTrend(score, previousScore);

  let toneClass =
    "bg-[var(--surface-2)] text-[var(--muted-text)] border-[var(--border)]";
  let arrow = "→";

  if (trend.direction === "up") {
    toneClass =
      "bg-[var(--pill-red-bg)] text-[var(--pill-red-text)] border-[var(--danger)]/20";
    arrow = "↑";
  } else if (trend.direction === "down") {
    toneClass =
      "bg-[var(--pill-green-bg)] text-[var(--pill-green-text)] border-[var(--green-text)]/20";
    arrow = "↓";
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${toneClass}`}>
      <span>{arrow}</span>
      <span>{trend.label}</span>
    </div>
  );
}

const BurnoutRiskCard = ({
  burnoutRisk,
  previousScore = null,
  variant = "wellness",
}) => {
  const navigate = useNavigate();
  const { score = 0, level = "Low", contributors = [] } = burnoutRisk || {};
  const style = riskStyles[level] || riskStyles.Low;

  const isDashboard = variant === "dashboard";
  const topContributors = contributors.slice(0, isDashboard ? 1 : 2);

  const navigateToWellness = isDashboard ? (
    <Button variant="secondary" onClick={() => navigate("/app/wellness")}>
      View Wellness Insights
      <FaExternalLinkAlt />
    </Button>
  ) : null;

  return (
    <Card
      className={isDashboard ? "p-5 md:p-6 h-full" : "p-6 md:p-7"}
      footer={navigateToWellness}>
      <div className="flex h-full flex-col gap-5">
        <div className="pt-1 flex items-start justify-between gap-4">
          <div className=" flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
              {isDashboard ? "Burnout Risk" : "Wellness Overview"}
            </p>

            {isDashboard ? null : (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text)]">
                  Burnout Risk
                </h2>

                <p className="mt-1 text-sm text-[var(--muted-text)]">
                  {style.copy}
                </p>
              </div>
            )}
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${style.badge}`}>
            {level}
          </span>
        </div>

        <SemiDonutGauge score={score} level={level} />

        <div className="flex flex-wrap items-center gap-3">
          <TrendPill score={score} previousScore={previousScore} />
        </div>

        {isDashboard ? null : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Stress
              </p>
              <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
                {burnoutRisk.averages?.stress ?? 0}/5
              </p>
            </div>

            <div className="rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Sleep
              </p>
              <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
                {burnoutRisk.averages?.sleep ?? 0}h
              </p>
            </div>

            <div className="rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Mood
              </p>
              <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
                {burnoutRisk.averages?.mood ?? 0}/5
              </p>
            </div>

            <div className="rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Focus
              </p>
              <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
                {burnoutRisk.averages?.focus ?? 0}/5
              </p>
            </div>
          </div>
        )}

        {isDashboard ? null : (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-bold text-[var(--text)]">
              Key Contributors
            </p>

            {topContributors.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted-text)]">
                No Major Contributors Detected Yet.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {topContributors.map((item) => (
                  <span
                    key={item.key}
                    className="rounded-full bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-text)]">
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BurnoutRiskCard;
