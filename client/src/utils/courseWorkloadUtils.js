export function calculateStudySummary(courses = [], weeklyCourseSummary = []) {
  const weeklyStudyGoal = courses.reduce(
    (total, course) => total + Number(course.weeklyGoalMinutes || 0),
    0,
  );

  const studyTimeCompleted =
    Array.isArray(weeklyCourseSummary) && weeklyCourseSummary.length > 0
      ? weeklyCourseSummary.reduce(
          (total, summaryItem) => total + Number(summaryItem.totalMinutes || 0),
          0,
        )
      : courses.reduce(
          (total, course) => total + Number(course.pomodoroStudyTime || 0),
          0,
        );

  return {
    weeklyStudyGoal,
    studyTimeCompleted,
  };
}
