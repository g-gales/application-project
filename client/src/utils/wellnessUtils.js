export function calculateBurnoutRisk({
  wellnessEntries = [],
  weeklyWorkloadHours = 0,
  weeklyCapacityHours = 0,
  overdueCount = 0,
  heavyLoadDays = 0,
}) {
  if (!wellnessEntries.length) {
    return {
      score: 0,
      level: "Low",
      contributors: [],
      actions: [],
    };
  }

  const avgStress =
    wellnessEntries.reduce((sum, entry) => sum + entry.stress, 0) /
    wellnessEntries.length;

  const avgSleep =
    wellnessEntries.reduce((sum, entry) => sum + entry.sleepHours, 0) /
    wellnessEntries.length;

  const avgMood =
    wellnessEntries.reduce((sum, entry) => sum + entry.mood, 0) /
    wellnessEntries.length;

  const avgFocus =
    wellnessEntries.reduce((sum, entry) => sum + entry.focus, 0) /
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

  const workloadRatio =
    weeklyCapacityHours > 0 ? weeklyWorkloadHours / weeklyCapacityHours : 0;

  let workloadPoints = 0;
  if (workloadRatio >= 1.2) workloadPoints = 20;
  else if (workloadRatio >= 1.0) workloadPoints = 16;
  else if (workloadRatio >= 0.85) workloadPoints = 10;
  else if (workloadRatio >= 0.7) workloadPoints = 5;

  let overduePoints = 0;
  if (overdueCount >= 5) overduePoints = 10;
  else if (overdueCount >= 3) overduePoints = 7;
  else if (overdueCount >= 1) overduePoints = 4;

  let sustainedLoadPoints = 0;
  if (heavyLoadDays >= 5) sustainedLoadPoints = 10;
  else if (heavyLoadDays >= 3) sustainedLoadPoints = 6;
  else if (heavyLoadDays >= 1) sustainedLoadPoints = 3;

  const rawScore =
    stressPoints +
    sleepPoints +
    moodPoints +
    focusPoints +
    workloadPoints +
    overduePoints +
    sustainedLoadPoints;

  const score = Math.min(100, Math.round(rawScore));

  let level = "Low";
  if (score >= 67) level = "High";
  else if (score >= 34) level = "Moderate";

  const contributors = [
    {
      key: "stress",
      label: "Elevated Stress",
      impact: Math.round(stressPoints),
    },
    { key: "sleep", label: "Low Sleep", impact: Math.round(sleepPoints) },
    { key: "mood", label: "Low Mood", impact: Math.round(moodPoints) },
    { key: "focus", label: "Low Focus", impact: Math.round(focusPoints) },
    {
      key: "workload",
      label: "High Workload",
      impact: Math.round(workloadPoints),
    },
    {
      key: "overdue",
      label: "Overdue Tasks",
      impact: Math.round(overduePoints),
    },
    {
      key: "sustainedLoad",
      label: "Sustained Heavy Workload",
      impact: Math.round(sustainedLoadPoints),
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

  if (workloadPoints >= 10) {
    actions.push("Review your workload and move non-urgent tasks if possible.");
  }

  if (overduePoints >= 4) {
    actions.push("Focus on clearing one overdue task to reduce pressure.");
  }

  if (focusPoints >= 5) {
    actions.push("Break large tasks into smaller study sessions.");
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
  };
}
