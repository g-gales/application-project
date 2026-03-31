import Card from "./Card";
import { formatHours } from "../../utils/priorityUtils";

function getDueLabel(daysUntil) {
  if (daysUntil < 0) {
    return `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"}`;
  }

  if (daysUntil === 0) {
    return "Due today";
  }

  if (daysUntil === 1) {
    return "Due tomorrow";
  }

  return `Due in ${daysUntil} days`;
}

function getPriorityTone(daysUntil) {
  if (daysUntil < 0) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }

  if (daysUntil <= 1) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  }

  if (daysUntil <= 3) {
    return "bg-[var(--tertiary)] text-[var(--tertiary-contrast)]";
  }

  return "bg-[var(--surface-3)] text-[var(--muted-text)]";
}

export default function NextPriorityCard({
  assignments = [],
  courses = [],
  priorityAssignments = [],
  detailsPath = "/assignments",
}) {
  const items = priorityAssignments.length > 0 ? priorityAssignments : [];

  const topItem = items[0];
  const extraItems = items.slice(1, 3);

  const getCourseName = (courseId) => {
    const match = courses.find((course) => course._id === courseId);
    return match?.name || match?.title || "Course";
  };

  return (
    <Card title="Next Priority" className="p-5 md:p-6 h-full">
      <div className="flex h-full flex-col gap-4">
        {!topItem ? (
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">
              Nothing urgent right now
            </p>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              You do not have any unfinished priority tasks at the moment.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">
                    {topItem.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-text)]">
                    {getCourseName(topItem.courseId)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityTone(topItem.daysUntil)}`}>
                  {getDueLabel(topItem.daysUntil)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[var(--radius)] bg-[var(--surface)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                    Remaining
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--text)]">
                    {formatHours(topItem.remainingMinutes)}
                  </p>
                </div>

                <div className="rounded-[var(--radius)] bg-[var(--surface)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text-2)]">
                    Status
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--text)] capitalize">
                    {topItem.status?.replace("-", " ")}
                  </p>
                </div>
              </div>
            </div>

            {extraItems.length > 0 && (
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-sm font-bold text-[var(--text)]">
                  Also coming up
                </p>

                <div className="mt-3 flex flex-col gap-3">
                  {extraItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-[var(--surface)] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text)]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--muted-text)]">
                          {getCourseName(item.courseId)} •{" "}
                          {formatHours(item.remainingMinutes)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${getPriorityTone(item.daysUntil)}`}>
                        {getDueLabel(item.daysUntil)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
