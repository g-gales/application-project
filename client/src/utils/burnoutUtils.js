export function calculateBurnoutRisk({
  wellnessEntries = [],
  workloadMetrics = {},
}) {
  if (!wellnessEntries.length) {
    return {
      score: 0,
      level: "Low",
      contributors: [],
      actions: [],
      averages: {
        stress: 0,
        sleep: 0,
        mood: 0,
        focus: 0,
      },
      workloadMetrics,
    };
  }

  const avgStress =
    wellnessEntries.reduce((sum, entry) => sum + Number(entry.stress || 0), 0) /
    wellnessEntries.length;

  const avgSleep =
    wellnessEntries.reduce(
      (sum, entry) => sum + Number(entry.sleepHours || 0),
      0,
    ) / wellnessEntries.length;

  const avgMood =
    wellnessEntries.reduce((sum, entry) => sum + Number(entry.mood || 0), 0) /
    wellnessEntries.length;

  const avgFocus =
    wellnessEntries.reduce((sum, entry) => sum + Number(entry.focus || 0), 0) /
    wellnessEntries.length;

  /*Wellness Points determined by following percentages:
    Stress:20%, Sleep: 15%, Mood: 15%, Focus: 10%
    Workload Capacity Ratio: 20%, Overdue/ Urgent Tasks: 10%, Sustained Heavy Load: 10%
    Future development - customizable adjustments*/
  const stressPoints = ((avgStress - 1) / 4) * 20;

  const sleepDeficit = Math.max(0, 8 - avgSleep);
  const sleepPoints = Math.min((sleepDeficit / 4) * 15, 15);

  const moodPoints = ((5 - avgMood) / 4) * 15;
  const focusPoints = ((5 - avgFocus) / 4) * 10;

  const {
    dueSoonMinutes = 0,
    overdueMinutes = 0,
    overdueCount = 0,
    studyProgressRatio = 1,
  } = workloadMetrics;

  let urgentWorkloadPoints = 0;
  if (dueSoonMinutes >= 600) urgentWorkloadPoints = 15;
  else if (dueSoonMinutes >= 360) urgentWorkloadPoints = 11;
  else if (dueSoonMinutes >= 180) urgentWorkloadPoints = 7;
  else if (dueSoonMinutes >= 60) urgentWorkloadPoints = 3;

  let overduePoints = 0;
  if (overdueCount >= 3 || overdueMinutes >= 360) overduePoints = 15;
  else if (overdueCount >= 2 || overdueMinutes >= 180) overduePoints = 10;
  else if (overdueCount >= 1 || overdueMinutes >= 60) overduePoints = 5;

  let studyDeficitPoints = 0;
  if (studyProgressRatio < 0.4) studyDeficitPoints = 10;
  else if (studyProgressRatio < 0.6) studyDeficitPoints = 7;
  else if (studyProgressRatio < 0.8) studyDeficitPoints = 4;
  else if (studyProgressRatio < 1.0) studyDeficitPoints = 2;

  const rawScore =
    stressPoints +
    sleepPoints +
    moodPoints +
    focusPoints +
    urgentWorkloadPoints +
    overduePoints +
    studyDeficitPoints;

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level = "Low";
  if (score >= 67) level = "High";
  else if (score >= 34) level = "Moderate";

  const contributors = [
    {
      key: "stress",
      label: "Elevated Stress",
      impact: Math.round(stressPoints),
      max: 20,
    },
    {
      key: "sleep",
      label: "Low Sleep",
      impact: Math.round(sleepPoints),
      max: 15,
    },
    { key: "mood", label: "Low Mood", impact: Math.round(moodPoints), max: 15 },
    {
      key: "focus",
      label: "Low Focus",
      impact: Math.round(focusPoints),
      max: 10,
    },
    {
      key: "urgentWorkload",
      label: "Heavy workload due soon",
      impact: urgentWorkloadPoints,
      max: 15,
    },
    {
      key: "overdue",
      label: "Overdue coursework",
      impact: overduePoints,
      max: 15,
    },
    {
      key: "studyDeficit",
      label: "Behind weekly study goal",
      impact: studyDeficitPoints,
      max: 10,
    },
  ]
    .filter((item) => item.impact > 0)
    .sort((a, b) => b.impact - a.impact);

  const actions = [];

  if (sleepPoints >= 8) {
    actions.push("Aim for at least 7–8 hours of sleep tonight.");
  }

  if (stressPoints >= 10) {
    actions.push(
      "Schedule a short recovery break or lighter task block today.",
    );
  }

  if (urgentWorkloadPoints >= 7) {
    actions.push("Review your workload and move non-urgent tasks if possible.");
  }

  if (overduePoints >= 5) {
    actions.push("Focus on clearing one overdue task to reduce pressure.");
  }

  if (focusPoints >= 5) {
    actions.push("Break large tasks into smaller study sessions.");
  }

  if (studyDeficitPoints >= 4) {
    actions.push("Schedule a study block to get closer to your weekly goal.");
  }

  return {
    score,
    level,
    contributors,
    actions,
    averages: {
      stress: Number(avgStress.toFixed(1)),
      sleep: Number(avgSleep.toFixed(1)),
      mood: Number(avgMood.toFixed(1)),
      focus: Number(avgFocus.toFixed(1)),
    },
    workloadMetrics,
  };
}
