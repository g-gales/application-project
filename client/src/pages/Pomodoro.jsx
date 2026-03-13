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

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // get list of courses
  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data || []));
  }, []);

  // deconstructed useTimer hook - TODO: onExpire should add time to course db
  const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => {
      if (isWorkMode) {
        setIsSummaryOpen(true);
      } else {
        alert("Break is over! Time to get back to it.");
        setIsWorkMode(true);
        refreshTimer(times.work);
      }
    },
  });

  // percentage for circularProgressBar
  const currentTotalSecs = (isWorkMode ? times.work : times.break) * 60;
  const percentage = Math.round(
    ((minutes * 60 + seconds) / currentTotalSecs) * 100,
  );

  // --- VALUES ---

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

  // --- HANDLERS ---

  const refreshTimer = (mins) => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + mins * 60);
    restart(time, false); // false for no autostart
  };

  const handleLogAndNext = async (nextAction) => {
    try {
      // TODO: this route is not created yet
      await api.post("/study-sessions", {
        courseId: selectedCourseId,
        durationMinutes: times.work,
        type: "pomodoro",
      });

      // 2. Handle what's next
      if (nextAction === "BREAK") {
        setIsWorkMode(false);
        refreshTimer(times.break);
        // We don't auto-start the break so the user can stand up/stretch first
      } else if (nextAction === "WORK") {
        setIsWorkMode(true);
        refreshTimer(times.work);
        resume();
      }

      setIsSummaryOpen(false);
    } catch (err) {
      console.error("Failed to log session", err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center bg-[var(--surface)] p-4 border border-[var(--border)] rounded-[var(--radius)] gap-4">
      <h1 className="text-lg font-bold ">What are we working on?</h1>

      {/* // select course  */}
      <select
        required
        value={selectedCourseId}
        onChange={(e) => setSelectedCourseId(e.target.value)}
        className="w-full p-2 mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
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
          disabled={!selectedCourseId}
        >
          {!selectedCourseId
            ? "Select a Course"
            : isRunning
              ? "Pause"
              : "Start"}
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={() => refreshTimer(isWorkMode ? times.work : times.break)}
          disabled={!selectedCourseId}
        >
          Reset
        </Button>
      </div>

      {/* // MODALS  */}

      {/* // SUMMARY OF SESSION MODAL  */}
      <Modal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Session Complete!"
      >
        <div className="space-y-4 text-center">
          <p className="text-[var(--text)]">
            Nice work! You've completed <strong>{times.work} minutes</strong> of
            focus.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleLogAndNext("BREAK")}
            >
              Take a Break
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleLogAndNext("WORK")}
            >
              New Session
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setIsSummaryOpen(false)}
            >
              Finish Session
            </Button>
          </div>
        </div>
      </Modal>

      {/* // EDIT TIMES MODAL  */}
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
