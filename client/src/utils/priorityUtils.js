export function getDaysUntil(dateString) {
  const today = new Date();
  const dueDate = new Date(dateString);

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dueStart = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );

  const diffMs = dueStart - todayStart;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getRemainingMinutes(assignment) {
  const estimated = Number(assignment.estimatedMinutes || 0);
  const completed = Number(assignment.minutesCompleted || 0);
  return Math.max(0, estimated - completed);
}

export function formatHours(minutes) {
  if (!minutes || minutes <= 0) return "0h";

  const hours = minutes / 60;

  if (hours < 1) {
    return `${minutes} min`;
  }

  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

export function getAssignmentPriorityScore(assignment) {
  const remainingMinutes = getRemainingMinutes(assignment);
  const daysUntil = getDaysUntil(assignment.dueDate);

  let score = 0;

  if (assignment.status === "done") {
    return -9999;
  }

  if (remainingMinutes <= 0) {
    return -9999;
  }

  // overdue = highest priority
  if (daysUntil < 0) {
    score += 1000;
  } else if (daysUntil === 0) {
    score += 850;
  } else if (daysUntil <= 3) {
    score += 650;
  } else if (daysUntil <= 7) {
    score += 450;
  } else {
    score += 150;
  }

  // larger unfinished work gets more weight
  score += Math.min(remainingMinutes, 600);

  // in-progress work gets a slight boost so users finish what they started
  if (assignment.status === "in-progress") {
    score += 75;
  }

  return score;
}

export function getPriorityAssignments(assignments = [], limit = 3) {
  return [...assignments]
    .filter((assignment) => {
      const remainingMinutes = getRemainingMinutes(assignment);
      return assignment.status !== "done" && remainingMinutes > 0;
    })
    .map((assignment) => ({
      ...assignment,
      remainingMinutes: getRemainingMinutes(assignment),
      daysUntil: getDaysUntil(assignment.dueDate),
      priorityScore: getAssignmentPriorityScore(assignment),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}
