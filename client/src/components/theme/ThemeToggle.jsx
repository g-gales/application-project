import { useTheme } from "./ThemeContext";
import Button from "../ui/Button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      className={"h-12 border-0"}
      variant="secondary"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="text-xl">{isDark ? "🌒" : "☀️"}</div>
    </Button>
  );
}
