import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import Card from "./Card";
import Button from "./Button";
import { FaExternalLinkAlt } from "react-icons/fa";

const CourseProgressWidget = () => {
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

  const navigateToCourses = (
    <Button variant="secondary" onClick={() => navigate("/app/courses")}>
      Courses
      <FaExternalLinkAlt />
    </Button>
  );

  // formatting into hours or minutes based on amount of minutes
  const getHoursOrMinutes = (totalMinutes) => {
    if (!totalMinutes || totalMinutes <= 0) return "0m";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0
      ? `${hours}h ${minutes > 0 ? ` ${minutes}m` : ""}`
      : `${minutes}m`;
  };

  return (
    <Card title="Weekly Study Goals" footer={navigateToCourses}>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-[var(--surface-2)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--surface-2)] rounded w-full"></div>
          </div>
        ) : courses.length > 0 ? (
          courses.map((course) => {
            const progressValue = course.pomodoroStudyTime || 0;
            const progressMax = course.weeklyGoalMinutes || 120;
            const progressColor = course.color || "#3b82f6";

            const percent = Math.min(
              (progressValue / progressMax) * 100 || 0,
              100,
            );

            return (
              <div key={course._id} className="flex flex-col gap-1.5">
                {/* // course code and minutes */}
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-black uppercase tracking-tight truncate max-w-[120px]">
                    {course.code}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {getHoursOrMinutes(progressValue)} /{" "}
                    {getHoursOrMinutes(progressMax)}
                  </span>
                </div>

                <div className="w-full h-4 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: progressColor,
                    }}
                  />
                </div>
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

export default CourseProgressWidget;