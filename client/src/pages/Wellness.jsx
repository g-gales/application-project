import { useEffect, useState, useMemo } from "react";
import { useCourses } from "../hooks/useCourses";
import api from "../api/axiosConfig";

import WellnessCheckIn from "../components/wellness/WellnessCheckIn";
import WellnessOverview from "../components/wellness/WellnessOverview";
import BurnoutActions from "../components/wellness/BurnoutActions";
import BurnoutInsights from "../components/wellness/BurnoutInsights";
import BurnoutAlerts from "../components/wellness/BurnoutAlerts";
import WellnessTrends from "../components/wellness/WellnessTrends";

import { calculateBurnoutRisk } from "../utils/burnoutUtils";
import { calculateWorkloadMetrics } from "../utils/workloadUtils";
import { calculateStudySummary } from "../utils/courseWorkloadUtils";
import { generateBurnoutAlerts } from "../utils/alertUtils";

import Card from "../components/ui/Card";

const Wellness = () => {
  const [wellnessEntries, setWellnessEntries] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const { courses } = useCourses();

  const fetchWellnessEntries = async () => {
    try {
      const res = await api.get("/wellness");
      setWellnessEntries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch wellness entries", error);
      setWellnessEntries([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments");
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      setAssignments([]);
    }
  };

  //Only fetches data once instead of on every render
  useEffect(() => {
    fetchWellnessEntries();
    fetchAssignments();
  }, []);

  const studySummary = useMemo(() => {
    return calculateStudySummary(courses);
  }, [courses]);

  const workloadMetrics = useMemo(() => {
    return calculateWorkloadMetrics({
      assignments,
      studySummary,
    });
  }, [assignments, studySummary]);

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

  const burnoutRisk = useMemo(() => {
    return calculateBurnoutRisk({
      wellnessEntries,
      workloadMetrics,
    });
  }, [wellnessEntries, workloadMetrics]);

  const burnoutAlerts = useMemo(() => {
    return generateBurnoutAlerts({
      wellnessEntries,
      burnoutRisk,
      workloadMetrics,
      previousBurnoutScore,
    });
  }, [wellnessEntries, burnoutRisk, workloadMetrics, previousBurnoutScore]);

  //Checks if a Wellness Entry was already submitted by this user today
  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const hasSubmittedToday = useMemo(() => {
    return wellnessEntries.some((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      return entryDate === today;
    });
  }, [wellnessEntries, today]);

  //----------------------
  const todaysEntry = useMemo(() => {
    return wellnessEntries.find((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      return entryDate === today;
    });
  }, [wellnessEntries, today]);

  //----------------------------------
  return (
    <div className="stack gap-md">
      <section className="flex flex-col gap-4">
        <WellnessOverview burnoutRisk={burnoutRisk} />
        {burnoutAlerts.length > 0 && <BurnoutAlerts alerts={burnoutAlerts} />}
        {localStorage.getItem("token") === "GUEST_USER_POWERUP" &&
          burnoutAlerts.length === 0 && (
            <BurnoutAlerts alerts={[]} testMode={true} />
          )}
        <WellnessTrends wellnessEntries={wellnessEntries} />
        <WellnessCheckIn
          hasSubmittedToday={hasSubmittedToday}
          onSuccess={fetchWellnessEntries}
          wellnessEntries={wellnessEntries}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <BurnoutInsights burnoutRisk={burnoutRisk} />
          <BurnoutActions burnoutRisk={burnoutRisk} />
        </div>
      </section>
    </div>
  );
};

export default Wellness;
