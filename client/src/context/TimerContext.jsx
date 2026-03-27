import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useTimer } from "react-timer-hook";
import { useNavigate } from "react-router-dom";

const TimerContext = createContext();

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

  const percentage = useMemo(() => {
    const total = (isWorkMode ? times.work : times.break) * 60;
    return Math.round(((minutes * 60 + seconds) / total) * 100);
  }, [minutes, seconds, isWorkMode, times]);

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

export const useGlobalTimer = () => useContext(TimerContext);
