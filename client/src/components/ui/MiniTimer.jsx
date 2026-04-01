import { useGlobalTimer } from "../../context/timerContext";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

export default function MiniTimer() {
  const { isRunning, percentage, minutes, seconds, isWorkMode } =
    useGlobalTimer();
  const navigate = useNavigate();

  if (!isRunning) return null;

  return (
    <Button
      variant={"secondary"}
      onClick={() => navigate("/app/pomodoro")}
      className={"h-12"}
    >
      {/* active clock */}
      <span className="text-sm font-mono font-bold text-[var(--text)]">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>

      {/* circle progressbar */}
      <div className="w-5 h-5">
        <CircularProgressbar
          value={percentage}
          strokeWidth={10}
          styles={{
            path: {
              stroke: isWorkMode ? "var(--primary)" : "var(--muted-text)",
              strokeLinecap: "butt",
              transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
            },
            trail: { stroke: "var(--border)" },
          }}
        />
      </div>
    </Button>
  );
}
