import { useEffect, useState } from "react";
import api from "../api/axiosConfig";

// timer and progress bar: https://www.npmjs.com/package/react-circular-progressbar
import { useTimer } from "react-timer-hook";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import Modal from "../components/ui/Modal";

export default function Pomodoro() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // times for work and break
  const [times, setTimes] = useState({ work: 25, break: 5 });
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);

  // deconstructed useTimer hook - TODO: onExpire should add time to course effort
  const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => alert(isWorkMode ? "Focus session done!" : "Break over!"),
  });

  // refresh timer will
  const refreshTimer = (mins) => {
    const newSecs = mins * 60;
    setTotalSeconds(newSecs);
    const time = new Date();
    time.setSeconds(time.getSeconds() + newSecs);
    restart(time, false);
  };

  // get list of courses
  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data || []));
  }, []);

  // percentage for circularProgressBar
  const percentage = Math.round(
    ((minutes * 60 + seconds) / totalSeconds) * 100,
  );

  return (
    <div className="w-full h-full flex flex-col items-center bg-[var(--surface)] p-4 border border-[var(--border)] rounded-[var(--radius)] gap-4">
      <h1 className="text-lg font-bold ">What are we working on?</h1>

      {/* // select course  */}
      <select
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
          styles={buildStyles({
            pathColor: isWorkMode ? "var(--primary)" : "var(--green-text)",
            textColor: "var(--text)",
            trailColor: "var(--border)",
            textSize: "20px",
          })}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-16">
          <span className="text-[10px] uppercase font-black opacity-60">
            {isWorkMode ? "Focus" : "Break"}
          </span>
          <span className="text-[9px] text-[var(--primary)] font-bold">
            Edit Times
          </span>
        </div>
      </div>

      {/* buttons for controls */}
      <div className="flex gap-3 w-full mt-auto max-w-[400px]">
        <button
          onClick={isRunning ? pause : resume}
          className="flex-1 py-3 rounded-[var(--radius)] bg-[var(--primary)] text-white font-bold uppercase text-xs"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => {
            setIsWorkMode(!isWorkMode);
            refreshTimer(!isWorkMode ? times.work : times.break);
          }}
          className="flex-1 py-3 rounded-[var(--radius)] border border-[var(--border)] text-xs font-bold uppercase"
        >
          {isWorkMode ? "Break" : "Focus"}
        </button>
        <button
          onClick={() => refreshTimer(isWorkMode ? times.work : times.break)}
          className="px-4 text-red-500 text-xs font-bold uppercase"
        >
          Reset
        </button>
      </div>

      {/* // modal to edit the time for work and break */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Timer Settings"
      >
        <div className="space-y-4">
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
                className="w-full p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] font-bold outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          ))}

          <button
            onClick={() => {
              refreshTimer(isWorkMode ? times.work : times.break);
              setIsSettingsOpen(false);
            }}
            className="w-full mt-2 py-3 bg-[var(--primary)] text-[var(--primary-contrast)] rounded-[var(--radius)] font-bold text-xs uppercase shadow-lg active:scale-95 transition-transform"
          >
            Apply Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}
