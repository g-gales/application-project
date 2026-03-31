import { useEffect, useState, useMemo } from "react";
import { useCourses } from "../hooks/useCourses";
import api from "../api/axiosConfig";

import WellnessCheckIn from "../components/wellness/WellnessCheckIn";
import WellnessOverview from "../components/wellness/WellnessOverview";
import BurnoutActions from "../components/wellness/BurnoutActions";
import BurnoutInsights from "../components/wellness/BurnoutInsights";
import BurnoutAlerts from "../components/wellness/BurnoutAlerts";
import WellnessTrends from "../components/wellness/WellnessTrends";

import { generateBurnoutAlerts } from "../utils/alertUtils";
import { generateTailoredRecommendations } from "../utils/recommendationUtils";
import { useBurnoutRisk } from "../hooks/useBurnoutRisk";

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

  const { burnoutRisk, previousBurnoutScore, workloadMetrics } = useBurnoutRisk(
    {
      wellnessEntries,
      assignments,
      courses,
    },
  );

  const burnoutAlerts = useMemo(() => {
    return generateBurnoutAlerts({
      wellnessEntries,
      burnoutRisk,
      workloadMetrics,
      previousBurnoutScore,
    });
  }, [wellnessEntries, burnoutRisk, workloadMetrics, previousBurnoutScore]);

  const tailoredRecommendations = useMemo(() => {
    return generateTailoredRecommendations({
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

  const todaysEntry = useMemo(() => {
    return wellnessEntries.find((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      return entryDate === today;
    });
  }, [wellnessEntries, today]);

  return (
    <div className="stack gap-md">
      <section className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
          <div className="xl:col-span-2">
            <WellnessOverview
              burnoutRisk={burnoutRisk}
              previousBurnoutScore={previousBurnoutScore}
            />
          </div>

          <div className="xl:col-span-1 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-1">
              {burnoutAlerts.length > 0 ? (
                <BurnoutAlerts alerts={burnoutAlerts} />
              ) : localStorage.getItem("token") === "GUEST_USER_POWERUP" ? (
                <BurnoutAlerts alerts={[]} testMode={true} />
              ) : null}
            </div>
          </div>
        </div>
        <WellnessTrends wellnessEntries={wellnessEntries} />
        <WellnessCheckIn
          hasSubmittedToday={hasSubmittedToday}
          onSuccess={fetchWellnessEntries}
          wellnessEntries={wellnessEntries}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <BurnoutInsights burnoutRisk={burnoutRisk} />
          {localStorage.getItem("token") === "GUEST_USER_POWERUP" ? (
            <BurnoutActions
              burnoutRisk={burnoutRisk}
              recommendations={tailoredRecommendations}
              testMode={true}
            />
          ) : (
            <BurnoutActions
              burnoutRisk={burnoutRisk}
              recommendations={tailoredRecommendations}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default Wellness;
