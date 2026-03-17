import { useEffect, useState, useMemo } from "react";

import api from "../api/axiosConfig";
import WellnessCheckIn from "../components/wellness/WellnessCheckIn";
import WellnessOverview from "../components/wellness/WellnessOverview";
import BurnoutActions from "../components/wellness/BurnoutActions";
import BurnoutInsights from "../components/wellness/BurnoutInsights";
import { calculateBurnoutRisk } from "../utils/wellnessUtils";
import Card from "../components/ui/Card";

const Wellness = () => {
  const [wellnessEntries, setWellnessEntries] = useState([]);

  //Only fetches data once instead of on every render
  const fetchWellnessEntries = async () => {
    try {
      const res = await api.get("/wellness");
      setWellnessEntries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch wellness entries", error);
      setWellnessEntries([]);
    }
  };

  useEffect(() => {
    fetchWellnessEntries();
  }, []);

  //   For when workload and capacity hours can be calculated
  //   const burnoutRisk = useMemo(() => {
  //   return calculateBurnoutRisk({
  //     wellnessEntries,
  //     weeklyWorkloadHours: 24,
  //     weeklyCapacityHours: 18,
  //     overdueCount: 2,
  //     heavyLoadDays: 4,
  //   });
  // }, [wellnessEntries]);
  const burnoutRisk = calculateBurnoutRisk({
    wellnessEntries,
  });

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
      <Card title="Wellness Trends" /> {/* TBD*/}
    </div>
  );
};

export default Wellness;
