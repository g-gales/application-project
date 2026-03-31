import Card from "../components/ui/Card";
import api from "../api/axiosConfig";

import { useState, useEffect, useMemo } from "react";
import CourseProgressWidget from "../components/ui/CourseProgressWidget";
import HeatmapDangerZones from "../components/HeatmapDangerZones";
import DashboardBurnoutRisk from "../components/wellness/DashboardBurnoutRisk";
import NextPriorityCard from "../components/ui/NextPriorityCard";

import { useBurnoutRisk } from "../hooks/useBurnoutRisk";
import { useCourses } from "../hooks/useCourses";
import { getPriorityAssignments } from "../utils/priorityUtils";

export default function Dashboard() {
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

  const priorityAssignments = useMemo(() => {
    return getPriorityAssignments(assignments, 3);
  }, [assignments]);

  const { burnoutRisk, previousBurnoutScore, workloadMetrics } = useBurnoutRisk(
    {
      wellnessEntries,
      assignments,
      courses,
    },
  );

  return (
    <div className="grid gap-5">
      <p className="text-[var(--muted-text)]">
        **Widgets are placeholders for later sprints.
      </p>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          <DashboardBurnoutRisk
            burnoutRisk={burnoutRisk}
            previousBurnoutScore={previousBurnoutScore}
          />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <CourseProgressWidget />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <Card title="Workload vs Capacity">
            <p className="text-[var(--muted-text)]">
              Placeholder: Donut chart showing workload vs capacity.
            </p>
          </Card>
        </div>
        <div className="col-span-12">
          <HeatmapDangerZones />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <NextPriorityCard
            assignments={assignments}
            courses={courses}
            priorityAssignments={priorityAssignments}
            detailsPath="/assignments"
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card title="Suggested Actions">
            <p className="text-[var(--muted-text)]">
              Placeholder: Quick action buttons for suggested burnout reduction
              strategies.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
