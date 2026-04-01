import Card from "./Card";

function formatHours(minutes = 0) {
  if (!minutes || minutes <= 0) return "0h";

  const hours = minutes / 60;

  if (hours < 1) {
    return `${Math.round(minutes)} min`;
  }

  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

function getCapacityStatus(loadRatio) {
  if (loadRatio > 1) {
    return {
      label: "Over capacity",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      bar: "bg-red-500",
      copy: "Your urgent workload is currently higher than your saved weekly study goals.",
    };
  }

  if (loadRatio > 0.8) {
    return {
      label: "Near capacity",
      badge: "bg-[var(--tertiary)] text-[var(--tertiary-contrast)]",
      bar: "bg-[var(--tertiary)]",
      copy: "You are getting close to your saved study goals this week.",
    };
  }

  return {
    label: "Within capacity",
    badge: "bg-[var(--green-bg)] text-[var(--green-text)]",
    bar: "bg-[var(--green-text)]",
    copy: "Your current workload looks manageable relative to your saved weekly study goals.",
  };
}

export default function WorkloadCard({ workloadMetrics = {} }) {
  const {
    dueSoonMinutes = 0,
    overdueMinutes = 0,
    overdueCount = 0,
    dueSoonCount = 0,
    weeklyStudyGoal = 0,
    studyTimeCompleted = 0,
    studyDeficitMinutes = 0,
  } = workloadMetrics;

  const workloadMinutes = dueSoonMinutes + overdueMinutes;
  const capacityMinutes = weeklyStudyGoal;
  const loadRatio = capacityMinutes > 0 ? workloadMinutes / capacityMinutes : 0;

  const progressPercent =
    capacityMinutes > 0
      ? Math.min((workloadMinutes / capacityMinutes) * 100, 100)
      : 0;

  const studyGoalProgress =
    weeklyStudyGoal > 0
      ? Math.min((studyTimeCompleted / weeklyStudyGoal) * 100, 100)
      : 0;

  const status = getCapacityStatus(loadRatio);

  return (
    <Card className="h-full p-5 md:p-6">
      <div className="flex h-full flex-col gap-4">
        <div className="pt-1 flex items-center justify-between gap-3">
          <p className=" text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
            Workload Balance
          </p>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${status.badge}`}>
            {status.label}
          </span>
        </div>
        <p className="px-1 text-sm text-[var(--muted-text)]">{status.copy}</p>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Workload
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text)]">
                {formatHours(workloadMinutes)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                Capacity
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text)]">
                {formatHours(capacityMinutes)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className={`h-full rounded-full ${status.bar} transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[var(--muted-text)]">
              <span>{Math.round(progressPercent)}% of capacity used</span>
              <span>
                {capacityMinutes > 0
                  ? `${Math.round(loadRatio * 100)}% load ratio`
                  : "No weekly goal set"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
              Due Soon
            </p>
            <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
              {dueSoonCount}
            </p>
            <p className="text-sm text-[var(--muted-text)]">
              {formatHours(dueSoonMinutes)}
            </p>
          </div>

          <div className="rounded-[var(--radius)] bg-[var(--surface-2)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
              Overdue
            </p>
            <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
              {overdueCount}
            </p>
            <p className="text-sm text-[var(--muted-text)]">
              {formatHours(overdueMinutes)}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--text)]">
                Weekly Study Goal Progress
              </p>
              <p className="mt-1 text-sm text-[var(--muted-text)]">
                {formatHours(studyTimeCompleted)} Completed
                {weeklyStudyGoal > 0
                  ? ` of ${formatHours(weeklyStudyGoal)}`
                  : ""}
              </p>
            </div>

            {studyDeficitMinutes > 0 && (
              <span className="rounded-full bg-[var(--surface-3)] px-3 py-1 text-xs font-bold text-[var(--muted-text)]">
                {formatHours(studyDeficitMinutes)} To Go
              </span>
            )}
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${studyGoalProgress}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
