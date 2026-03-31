import { useMemo } from "react";

import { calculateBurnoutRisk } from "../utils/burnoutUtils";
import { calculateWorkloadMetrics } from "../utils/workloadUtils";
import { calculateStudySummary } from "../utils/courseWorkloadUtils";

export function useBurnoutRisk({ wellnessEntries, assignments, courses }) {
  const studySummary = useMemo(() => calculateStudySummary(courses), [courses]);

  const workloadMetrics = useMemo(() => {
    return calculateWorkloadMetrics({
      assignments,
      studySummary,
    });
  }, [assignments, studySummary]);

  const burnoutRisk = useMemo(() => {
    return calculateBurnoutRisk({
      wellnessEntries,
      workloadMetrics,
    });
  }, [wellnessEntries, workloadMetrics]);

  const previousBurnoutScore = useMemo(() => {
    if (wellnessEntries.length < 6) return null;

    const sortedEntries = [...wellnessEntries].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    const previousSlice = sortedEntries.slice(0, -3);
    if (!previousSlice.length) return null;

    const previousRisk = calculateBurnoutRisk({
      wellnessEntries: previousSlice,
      workloadMetrics,
    });

    return previousRisk.score;
  }, [wellnessEntries, workloadMetrics]);

  return { burnoutRisk, previousBurnoutScore, workloadMetrics };
}
