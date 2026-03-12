import { useEffect, useState } from "react";
import api from "../api/axiosConfig";

// timer and progress bar: https://www.npmjs.com/package/react-circular-progressbar
import { useTimer } from "react-timer-hook";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

export default function Pomodoro() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // times for work mode and break
  const [times, setTimes] = useState({ work: 25, break: 5 });
  const [isWorkMode, setIsWorkMode] = useState(true);

  // deconstructed useTimer hook - TODO: onExpire should add time to course db
  const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => alert(isWorkMode ? "Focus session done!" : "Break over!"),
  });

  // refreshTimer will reset seconds with new minute value and resets the timer
  const refreshTimer = (mins) => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + mins * 60);
    restart(time, false);
  };

  const toggleMode = () => {
    const nextMode = !isWorkMode;
    setIsWorkMode(nextMode);
    refreshTimer(nextMode ? times.work : times.break);
  };

  // get list of courses
  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data || []));
  }, []);

  // percentage for circularProgressBar
  const currentTotalSecs = (isWorkMode ? times.work : times.break) * 60;
  const percentage = Math.round(
    ((minutes * 60 + seconds) / currentTotalSecs) * 100,
  );

  // styles for circle progress bar
  const timerStyles = {
    path: {
      stroke: isWorkMode ? "var(--primary)" : "var(--muted-text)",
      strokeLinecap: "butt",
      transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
    },
    trail: { stroke: "var(--border)", strokeLinecap: "butt" },
    text: { fill: "var(--text)", fontSize: "20px", fontWeight: "900" },
  };

  return (
    <div className="w-full h-full flex flex-col items-center bg-[var(--surface)] p-4 border border-[var(--border)] rounded-[var(--radius)] gap-4">
      <h1 className="text-lg font-bold ">What are we working on?</h1>

      {/* // select course  */}
      <select
        required
        value={selectedCourseId}
        onChange={(e) => setSelectedCourseId(e.target.value)}
        className="w-full p-2 mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
      >
        <option value="">-- Select a Course --</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>
            {c.code}: {c.name}
          </option>
        ))}
      </select>

      {/* timer circle */}
      <div
        onClick={() => setIsSettingsOpen(true)}
        className="w-48 h-48  relative cursor-pointer hover:scale-105 transition-transform mb-4"
      >
        <CircularProgressbar
          value={percentage}
          text={`${minutes}:${seconds.toString().padStart(2, "0")}`}
          styles={timerStyles}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-16 hover:underline">
          <span className="text-[9px] text-[var(--primary)] font-bold ">
            Edit Times
          </span>
        </div>
      </div>

      {/* buttons for controls */}
      <div className="flex gap-3 w-full mt-auto max-w-[400px]">
        <Button
          variant={isRunning ? "secondary" : "primary"}
          fullWidth
          onClick={isRunning ? pause : resume}
        >
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button variant="secondary" fullWidth onClick={toggleMode}>
          {isWorkMode ? "Break" : "Focus"}
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={() => refreshTimer(isWorkMode ? times.work : times.break)}
        >
          Reset
        </Button>
      </div>

      {/* // modal to edit the time for work and break */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Timer Settings"
        showCloseButton={false}
      >
        <div className="space-y-4 min-w-[240px]">
          {["work", "break"].map((type) => (
            <div key={type}>
              <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">
                {type} Minutes
              </label>
              <input
                type="number"
                value={times[type]}
                onChange={(e) =>
                  setTimes({ ...times, [type]: Number(e.target.value) })
                }
                className="w-full p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] font-bold outline-none"
              />
            </div>
          ))}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              fullWidth
              onClick={() => {
                refreshTimer(isWorkMode ? times.work : times.break);
                setIsSettingsOpen(false);
              }}
            >
              Apply Changes
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
