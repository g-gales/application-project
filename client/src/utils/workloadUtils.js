function getDateOnlyString(dateValue) {
  if (!dateValue) return "";
  return String(dateValue).split("T")[0];
}

export function calculateWorkloadMetrics({
  assignments = [],
  studySummary = {},
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysStr = sevenDaysFromNow.toISOString().split("T")[0];

  let remainingMinutesTotal = 0;
  let dueSoonMinutes = 0;
  let overdueMinutes = 0;
  let dueSoonCount = 0;
  let overdueCount = 0;

  const activeAssignments = assignments.filter(
    (assignment) => assignment.status !== "done",
  );

  activeAssignments.forEach((assignment) => {
    const remainingMinutes = Math.max(
      0,
      Number(assignment.estimatedMinutes || 0) -
        Number(assignment.minutesCompleted || 0),
    );

    remainingMinutesTotal += remainingMinutes;

    const dueDateStr = getDateOnlyString(assignment.dueDate);

    if (!dueDateStr) return;

    if (dueDateStr < todayStr) {
      overdueCount += 1;
      overdueMinutes += remainingMinutes;
    } else if (dueDateStr >= todayStr && dueDateStr <= sevenDaysStr) {
      dueSoonCount += 1;
      dueSoonMinutes += remainingMinutes;
    }
  });

  const weeklyStudyGoal = Number(studySummary.weeklyStudyGoal || 0);
  const studyTimeCompleted = Number(studySummary.studyTimeCompleted || 0);

  const studyDeficitMinutes = Math.max(0, weeklyStudyGoal - studyTimeCompleted);

  const studyProgressRatio =
    weeklyStudyGoal > 0 ? studyTimeCompleted / weeklyStudyGoal : 1;

  return {
    remainingMinutesTotal,
    dueSoonMinutes,
    overdueMinutes,
    dueSoonCount,
    overdueCount,
    weeklyStudyGoal,
    studyTimeCompleted,
    studyDeficitMinutes,
    studyProgressRatio,
  };
}
