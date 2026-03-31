import { useEffect, useMemo, useState } from "react";

import api from "../api/axiosConfig";

export function useWeeklyStudySummary(offset = 0, enabled = true) {
  const [weeklyStudySummary, setWeeklyStudySummary] = useState([]);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!enabled) {
      setWeeklyStudySummary([]);
      setDailyBreakdown([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchWeeklyStudySummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get(`/study-sessions/summary?offset=${offset}`);
        const courseSummary = Array.isArray(res.data?.courseSummary)
          ? res.data.courseSummary
          : [];
        const daily = Array.isArray(res.data?.dailyBreakdown)
          ? res.data.dailyBreakdown
          : [];

        if (isMounted) {
          setWeeklyStudySummary(courseSummary);
          setDailyBreakdown(daily);
        }
      } catch (err) {
        console.error("Failed to fetch weekly study summary", err);
        if (isMounted) {
          setWeeklyStudySummary([]);
          setDailyBreakdown([]);
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
  }, [offset, enabled]);

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
    dailyBreakdown,
    isLoading,
    error,
  };
}
