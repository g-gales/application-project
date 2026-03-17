import { useEffect, useState, useMemo } from "react";

import api from "../api/axiosConfig";
import WellnessCheckIn from "../components/wellness/WellnessCheckIn";
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
      <section className="flex flex-col gap-6">
        <WellnessCheckIn
          hasSubmittedToday={hasSubmittedToday}
          onSuccess={fetchWellnessEntries}
          wellnessEntries={wellnessEntries}
        />
      </section>
      <Card title="Wellness Overview" /> {/* TBD*/}
      <Card title="Wellness Trends" /> {/* TBD*/}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Insights" className="p-6"></Card>
        <Card title="Actions" className="p-6"></Card>
      </div>{" "}
      {/* TBD*/}
    </div>
  );
};

export default Wellness;
