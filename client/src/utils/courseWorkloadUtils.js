export function calculateStudySummary(courses = []) {
  return courses.reduce(
    (totals, course) => {
      totals.weeklyStudyGoal += Number(course.weeklyGoalMinutes || 0);
      totals.studyTimeCompleted += Number(course.pomodoroStudyTime || 0);
      return totals;
    },
    {
      weeklyStudyGoal: 0,
      studyTimeCompleted: 0,
    },
  );
}
