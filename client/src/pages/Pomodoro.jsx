import React, { useState } from "react";
import { useTimer } from "react-timer-hook";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Pomodoro() {
  const [sessionTime, setSessionTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);

  const expiryTimestamp = new Date();
  expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + 25 * 60);

  const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp,
    autoStart: false,
    onExpire: () => handleTimerExpire(),
  });

  const handleTimerExpire = () => {
    alert(isWorkMode ? "Work session finished!" : "Break over!");
  };

  const handleConfigureTimer = () => {
    const newTotal = (isWorkMode ? sessionTime : breakTime) * 60;
    setTotalSeconds(newTotal);
    const time = new Date();
    time.setSeconds(time.getSeconds() + newTotal);
    restart(time, false);
  };

  const currentSeconds = minutes * 60 + seconds;
  const percentage = Math.round((currentSeconds / totalSeconds) * 100);

  return (
    <div className="w-full h-full flex-1 m-auto">
      <div className="w-full h-full bg-white p-4 flex flex-col border-1 border-gray-300 rounded-xl">
        <div className="course-selection">select a course here</div>
        <div className="pomodoro-timer">timer here</div>
        <div className="controls">start stop reset</div>
      </div>
    </div>
  );
}
