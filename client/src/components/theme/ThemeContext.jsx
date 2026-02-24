import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);

function getInitialTheme() {
  // 1) Saved user preference
  const saved = localStorage.getItem("sp_theme");
  if (saved === "light" || saved === "dark") return saved;

  // 2) System preference
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  )?.matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("sp_theme", theme);
  }, [theme]);

  const value = useMemo(() => {
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
