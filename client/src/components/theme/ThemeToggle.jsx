import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-[var(--border)] hover:bg-[var(--surface-2)]"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}>
      {isDark ? "Dark" : "Light"}
    </button>
  );
}
