import { useState, useCallback, useMemo } from "react";
import { useTimer } from "react-timer-hook";
import { useNavigate } from "react-router-dom";
import { TimerContext } from "./timerContext";

const newDate = Date.now();

export const TimerProvider = ({ children }) => {
  const [times, setTimes] = useState({ work: 25, break: 5 });
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const navigate = useNavigate();

  const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: new Date(newDate + 25 * 60 * 1000),
    autoStart: false,
    onExpire: () => {
      if (isWorkMode) {
        setIsSummaryOpen(true);
        navigate("/app/pomodoro");
      } else {
        setIsWorkMode(true);
        refreshTimer(times.work);
      }
    },
  });

  const refreshTimer = useCallback(
    (mins) => {
      const time = new Date();
      time.setSeconds(time.getSeconds() + (mins > 0 ? mins * 60 : 1));
      restart(time, false);
    },
    [restart],
  );

  const totalSeconds = useMemo(
    () => ((isWorkMode ? times.work : times.break) || 0) * 60,
    [isWorkMode, times],
  );

  const percentage = useMemo(() => {
    const total = totalSeconds;
    return total > 0 ? Math.round(((minutes * 60 + seconds) / total) * 100) : 0;
  }, [minutes, seconds, totalSeconds]);

  const value = {
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
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
