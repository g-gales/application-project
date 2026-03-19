function average(entries, key) {
  if (!entries.length) return 0;
  return (
    entries.reduce((sum, entry) => sum + Number(entry[key] || 0), 0) /
    entries.length
  );
}

function roundToOne(num) {
  return Number(num.toFixed(1));
}

export function generateBurnoutAlerts({
  wellnessEntries = [],
  burnoutRisk = {},
  workloadMetrics = {},
  previousBurnoutScore = null,
}) {
  const alerts = [];

  if (!wellnessEntries.length) {
    return alerts;
  }

  const sortedEntries = [...wellnessEntries].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const recentEntries = sortedEntries.slice(-3);
  const previousEntries = sortedEntries.slice(-6, -3);

  const recentStressAvg = average(recentEntries, "stress");
  const previousStressAvg = average(previousEntries, "stress");

  const recentSleepAvg = average(recentEntries, "sleepHours");
  const previousSleepAvg = average(previousEntries, "sleepHours");

  const recentMoodAvg = average(recentEntries, "mood");
  const previousMoodAvg = average(previousEntries, "mood");

  // 1. High burnout risk
  if (burnoutRisk.level === "High") {
    alerts.push({
      id: "high-burnout",
      level: "danger",
      title: "High burnout risk detected",
      message:
        "Your current wellness and workload patterns suggest a high burnout risk.",
      action: "Reduce pressure where possible and focus on recovery.",
      details: {
        score: burnoutRisk.score,
        level: burnoutRisk.level,
      },
    });
  }

  // 2. Stress trending upward
  if (previousEntries.length && recentStressAvg - previousStressAvg >= 0.8) {
    const stressIncrease = roundToOne(recentStressAvg - previousStressAvg);

    alerts.push({
      id: "stress-rise",
      level: "warning",
      title: "Stress is trending upward",
      message: `Your average stress increased by ${stressIncrease} points compared to your previous 3 check-ins.`,
      action: "Try adding short recovery breaks or reducing non-urgent tasks.",
      details: {
        recentAverage: roundToOne(recentStressAvg),
        previousAverage: roundToOne(previousStressAvg),
        change: stressIncrease,
        unit: "points",
      },
    });
  }

  // 3. Sleep decreasing
  if (previousEntries.length && previousSleepAvg - recentSleepAvg >= 0.8) {
    const sleepDrop = roundToOne(previousSleepAvg - recentSleepAvg);

    alerts.push({
      id: "sleep-decline",
      level: "warning",
      title: "Sleep is trending downward",
      message: `Your average sleep dropped by ${sleepDrop} hours compared to your previous 3 check-ins.`,
      action:
        "Aim for 7–8 hours of sleep and reduce late-night workload where possible.",
      details: {
        recentAverage: roundToOne(recentSleepAvg),
        previousAverage: roundToOne(previousSleepAvg),
        change: -sleepDrop,
        unit: "hours",
      },
    });
  }

  // 4. Mood dropping
  if (previousEntries.length && previousMoodAvg - recentMoodAvg >= 0.8) {
    const moodDrop = roundToOne(previousMoodAvg - recentMoodAvg);

    alerts.push({
      id: "mood-drop",
      level: "warning",
      title: "Mood is trending lower",
      message: `Your average mood dropped by ${moodDrop} points compared to your previous 3 check-ins.`,
      action: "Take time to recover and avoid overloading your schedule.",
      details: {
        recentAverage: roundToOne(recentMoodAvg),
        previousAverage: roundToOne(previousMoodAvg),
        change: -moodDrop,
        unit: "points",
      },
    });
  }

  // 5. Heavy workload due soon
  if ((workloadMetrics.dueSoonMinutes || 0) >= 360) {
    const hoursDueSoon = roundToOne(workloadMetrics.dueSoonMinutes / 60);

    alerts.push({
      id: "urgent-workload",
      level: "warning",
      title: "Workload pressure is building",
      message: `You have about ${hoursDueSoon} hours of unfinished work due within the next 7 days.`,
      action: "Prioritize the most urgent assignments first.",
      details: {
        dueSoonMinutes: workloadMetrics.dueSoonMinutes,
        dueSoonHours: hoursDueSoon,
        unit: "hours",
      },
    });
  }

  // 6. Overdue work
  if ((workloadMetrics.overdueCount || 0) >= 1) {
    const overdueHours = roundToOne((workloadMetrics.overdueMinutes || 0) / 60);

    alerts.push({
      id: "overdue-work",
      level: "warning",
      title: "Overdue coursework detected",
      message: `You currently have ${workloadMetrics.overdueCount} overdue assignment${
        workloadMetrics.overdueCount > 1 ? "s" : ""
      } with about ${overdueHours} hours of work remaining.`,
      action: "Choose one overdue task to complete or reduce today.",
      details: {
        overdueCount: workloadMetrics.overdueCount,
        overdueMinutes: workloadMetrics.overdueMinutes,
        overdueHours,
        unit: "hours",
      },
    });
  }

  // 7. Burnout Score Increased
  if (
    typeof previousBurnoutScore === "number" &&
    burnoutRisk.score - previousBurnoutScore >= 8
  ) {
    const scoreIncrease = burnoutRisk.score - previousBurnoutScore;

    alerts.push({
      id: "burnout-rise",
      level: "warning",
      title: "Burnout risk is increasing",
      message: `Your burnout score increased by ${scoreIncrease} points compared to your previous trend.`,
      action:
        "Review your workload and recovery habits before the pressure builds further.",
      details: {
        currentScore: burnoutRisk.score,
        previousScore: previousBurnoutScore,
        change: scoreIncrease,
        unit: "points",
      },
    });
  }

  return alerts;
}
