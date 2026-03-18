import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { FaExternalLinkAlt } from "react-icons/fa";

const PomodoroMini = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => {
        setCourses(res.data || []);
      })
      .catch((err) => console.error("Error fetching courses for widget:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const navigateToPomodoro = (
    <Button variant="secondary" onClick={() => navigate("/app/pomodoro")}>
      Pomodoro
      <FaExternalLinkAlt />
    </Button>
  );

  // formatting into hours or minutes based on amount of minutes
  const getHoursOrMinutes = (totalMinutes) => {
    if (!totalMinutes || totalMinutes <= 0) return "0m";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0
      ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
      : `${minutes}m`;
  };

  return (
    <Card title="Weekly Study Goals" footer={navigateToPomodoro}>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-[var(--surface-2)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--surface-2)] rounded w-full"></div>
          </div>
        ) : courses.length > 0 ? (
          courses.map((course) => {
            return (
              <div key={course._id} className="flex flex-col gap-1.5">
                {/* // course code and minutes */}
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-black uppercase tracking-tight truncate max-w-[120px]">
                    {course.code}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {getHoursOrMinutes(course.pomodoroStudyTime)} /{" "}
                    {getHoursOrMinutes(course.weeklyGoalMinutes)}
                  </span>
                </div>

                {/* // progress bar  */}
                <progress
                  className="w-full h-4 rounded-full overflow-hidden 
                [&::-webkit-progress-bar]:bg-[var(--surface-3)] 
                [&::-webkit-progress-value]:bg-[var(--primary)]
                [&::-moz-progress-bar]:bg-[var(--primary)]"
                  value={course.pomodoroStudyTime}
                  max={course.weeklyGoalMinutes || 120}
                />
              </div>
            );
          })
        ) : (
          <p className="text-xs opacity-50 text-center py-2">
            No active courses found.
          </p>
        )}
      </div>
    </Card>
  );
};

export default PomodoroMini;
