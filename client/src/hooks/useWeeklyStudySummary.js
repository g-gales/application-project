import { useEffect, useMemo, useState } from "react";

import api from "../api/axiosConfig";

export function useWeeklyStudySummary() {
  const [weeklyStudySummary, setWeeklyStudySummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWeeklyStudySummary = async () => {
      try {
        const res = await api.get("/study-sessions/summary");
        const summary = Array.isArray(res.data?.courseSummary)
          ? res.data.courseSummary
          : [];

        if (isMounted) {
          setWeeklyStudySummary(summary);
        }
      } catch (err) {
        console.error("Failed to fetch weekly study summary", err);
        if (isMounted) {
          setWeeklyStudySummary([]);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWeeklyStudySummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const weeklyStudyMinutesByCourseId = useMemo(() => {
    return weeklyStudySummary.reduce((map, item) => {
      if (item && item._id) {
        map[item._id] = Number(item.totalMinutes || 0);
      }
      return map;
    }, {});
  }, [weeklyStudySummary]);

  return {
    weeklyStudySummary,
    weeklyStudyMinutesByCourseId,
    isLoading,
    error,
  };
}
