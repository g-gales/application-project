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

export function generateTailoredRecommendations({
  wellnessEntries = [],
  burnoutRisk = {},
  workloadMetrics = {},
  previousBurnoutScore = null,
}) {
  const recommendations = [];

  if (!wellnessEntries.length) return recommendations;

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

  const stressUp =
    previousEntries.length && recentStressAvg - previousStressAvg >= 0.8;
  const sleepDown =
    previousEntries.length && previousSleepAvg - recentSleepAvg >= 0.8;
  const moodDown =
    previousEntries.length && previousMoodAvg - recentMoodAvg >= 0.8;
  const urgentWorkload = (workloadMetrics.dueSoonMinutes || 0) >= 360;
  const overdueWork = (workloadMetrics.overdueCount || 0) >= 1;
  const burnoutHigh = burnoutRisk.level === "High";
  const burnoutRising =
    typeof previousBurnoutScore === "number" &&
    burnoutRisk.score - previousBurnoutScore >= 8;

  if (stressUp && sleepDown) {
    recommendations.push({
      id: "recovery-priority",
      title: "Prioritize your Wellness Recovery",
      message:
        "Your stress has increased while sleep has dropped, which can make academic pressure feel harder to manage.",
      suggestions: [
        "Reduce or delay one non-urgent task this week.",
        "Set a stopping point for tonight’s work.",
        "Aim for a full night of sleep before your next heavy study block.",
      ],
      priority: "high",
    });
  }

  if (urgentWorkload && overdueWork) {
    recommendations.push({
      id: "backlog-control",
      title: "Focus on Clearing Overdue Work",
      message:
        "You have both urgent upcoming work and overdue tasks, which can quickly increase stress and burnout risk.",
      suggestions: [
        "Choose one overdue task to finish, reduce, or submit today.",
        "Prioritize only the most time-sensitive work for the next 7 days.",
        "Avoid starting lower-priority tasks until overdue work is reduced.",
      ],
      priority: "high",
    });
  }

  if (burnoutHigh && burnoutRising) {
    recommendations.push({
      id: "capacity-protection",
      title: "You're Close to Your Limit",
      message:
        "Your burnout risk is already high and continues to rise, so this is a good time to simplify your workload where possible.",
      suggestions: [
        "Limit today’s plan to your top 1–2 priorities.",
        "Take a short recovery break before your next study block.",
        "Choose progress over perfection on lower-stakes work.",
      ],
      priority: "high",
    });
  }

  if (moodDown && urgentWorkload) {
    recommendations.push({
      id: "stabilize-routine",
      title: "Simplify Your Schedule",
      message:
        "Your mood is trending down while workload pressure remains high, which may be a sign that your schedule needs more breathing room.",
      suggestions: [
        "Break large tasks into smaller pieces before starting.",
        "Plan a shorter, more realistic study block today.",
        "Leave space between tasks instead of scheduling back-to-back work.",
      ],
      priority: "medium",
    });
  }

  if (!recommendations.length && burnoutRisk.actions?.length) {
    recommendations.push({
      id: "general-support",
      title: "Suggested next steps",
      message:
        "Your current patterns do not show a strong combined risk pattern, but these actions may still help you stay balanced.",
      suggestions: burnoutRisk.actions.slice(0, 3),
      priority: "low",
    });
  }

  return recommendations;
}
