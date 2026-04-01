import { useEffect, useState, useMemo } from "react";
import { useCourses } from "../hooks/useCourses";
import api from "../api/axiosConfig";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import toast from "react-hot-toast";

import { useGlobalTimer } from "../context/timerContext";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function Pomodoro() {
  const { courses } = useCourses();
  const [assignments, setAssignments] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // get timer values from context
  const {
    seconds,
    minutes,
    isRunning,
    isWorkMode,
    percentage,
    times,
    setTimes,
    selectedCourseId,
    setSelectedCourseId,
    selectedAssignmentId,
    setSelectedAssignmentId,
    isSummaryOpen,
    setIsSummaryOpen,
    pause,
    resume,
    restart,
    refreshTimer,
    setIsWorkMode,
  } = useGlobalTimer();

  // Local derived timer state
  const totalWorkSeconds = times.work * 60;
  const currentRemainingSeconds = minutes * 60 + seconds;
  const elapsedSeconds = totalWorkSeconds - currentRemainingSeconds;
  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const isPaused =
    isWorkMode &&
    !isRunning &&
    elapsedSeconds > 0 &&
    elapsedSeconds < totalWorkSeconds;

  // Fetch assignments
  useEffect(() => {
    api
      .get("/assignments")
      .then((assignRes) => {
        setAssignments(assignRes.data || []);
      })
      .catch((err) => console.error("Error fetching assignments", err));
  }, []);

  const filteredAssignments = useMemo(() => {
    if (!selectedCourseId) return [];
    return assignments.filter(
      (a) => a.courseId === selectedCourseId && a.status !== "done",
    );
  }, [selectedCourseId, assignments]);

  const handleSaveSession = async ({
    durationMinutes = times.work,
    nextAction,
    successMessage = "Session saved!",
    errorMessage = "Failed to save session",
  } = {}) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api.post("/study-sessions", {
        courseId: selectedCourseId,
        durationMinutes,
        type: "pomodoro",
      });
      if (selectedAssignmentId) {
        await api.put(`/assignments/${selectedAssignmentId}/progress`, {
          minutes: durationMinutes,
        });
      }
      toast.success(successMessage);
      if (nextAction === "BREAK") {
        setIsWorkMode(false);
        refreshTimer(times.break);
      } else if (nextAction === "WORK") {
        setIsWorkMode(true);
        const newTime = new Date();
        newTime.setSeconds(newTime.getSeconds() + times.work * 60);
        restart(newTime, true);
      }
      setIsSummaryOpen(false);
    } catch (err) {
      toast.error(errorMessage);
      console.error(errorMessage, err);
    } finally {
      setIsSaving(false);
    }
  };

  const timerStyles = {
    path: {
      stroke: isWorkMode ? "var(--primary)" : "var(--muted-text)",
      strokeLinecap: "butt",
      transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
    },
    trail: { stroke: "var(--border)", strokeLinecap: "butt" },
    text: { fill: "var(--text)", fontSize: "20px", fontWeight: "900" },
  };

  const canSavePausedSession = isPaused && selectedCourseId;

  const handleApplySettings = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextTimes = {
      work: Number(formData.get("work")) || times.work,
      break: Number(formData.get("break")) || times.break,
    };

    setTimes(nextTimes);
    refreshTimer(isWorkMode ? nextTimes.work : nextTimes.break);
    setIsSettingsOpen(false);
  };

  const footerControls = (
    <div className="flex mx-auto max-w-lg gap-2 w-full">
      <Button
        variant={isRunning ? "secondary" : "primary"}
        fullWidth
        onClick={isRunning ? pause : resume}
        disabled={!selectedCourseId}
      >
        {!selectedCourseId ? "Select a Course" : isRunning ? "Pause" : "Start"}
      </Button>

      {canSavePausedSession && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            handleSaveSession({
              durationMinutes: elapsedMinutes,
              successMessage: "Paused session saved!",
              errorMessage: "Failed to save paused session",
            })
          }
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Session"}
        </Button>
      )}

      <Button
        variant="danger"
        fullWidth
        onClick={() => {
          setIsWorkMode(true);
          refreshTimer(times.work);
        }}
        disabled={!selectedCourseId}
      >
        Reset
      </Button>
    </div>
  );

  return (
    <Card title="What are we working on?" footer={footerControls}>
      <div className="flex flex-col items-center">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full p-2 mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] max-w-128 cursor-pointer"
        >
          <option value="">-- Select a Course --</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code}: {c.name}
            </option>
          ))}
        </select>

        {filteredAssignments.length > 0 && (
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full p-2 mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] max-w-128 cursor-pointer"
          >
            <option value="">-- Select an Assignment (Optional) --</option>
            {filteredAssignments.map((a) => (
              <option key={a._id} value={a._id}>
                {a.title}
              </option>
            ))}
          </select>
        )}

        <div
          onClick={() => setIsSettingsOpen(true)}
          className="w-48 h-48 relative cursor-pointer hover:scale-105 transition-transform mb-4"
        >
          <CircularProgressbar
            value={percentage}
            text={`${minutes}:${seconds.toString().padStart(2, "0")}`}
            styles={timerStyles}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-16">
            <span className="text-[9px] text-[var(--primary)] font-bold hover:underline">
              Edit Times
            </span>
          </div>
        </div>

        {/* Modals */}
        <Modal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          title="Session Complete!"
        >
          <div className="space-y-4 text-center">
            <p>
              Nice work! You've completed <strong>{times.work} minutes</strong>.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => handleSaveSession({ nextAction: "BREAK" })}
              >
                Take a Break
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => handleSaveSession({ nextAction: "WORK" })}
              >
                New Session
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => handleSaveSession({ nextAction: "FINISH" })}
              >
                Save Session
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Timer Settings"
        >
          <form className="space-y-4" onSubmit={handleApplySettings}>
            {["work", "break"].map((type) => (
              <div key={type}>
                <label className="text-[10px] uppercase font-bold opacity-60 block mb-1">
                  {type} Minutes
                </label>
                <input
                  type="number"
                  name={type}
                  min="1"
                  defaultValue={times[type]}
                  className="w-full p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)]"
                />
              </div>
            ))}
            <Button fullWidth type="submit">
              Apply
            </Button>
          </form>
        </Modal>
      </div>
    </Card>
  );
}
