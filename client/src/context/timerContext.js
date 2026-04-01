import { createContext, useContext } from "react";

export const TimerContext = createContext(null);

export function useGlobalTimer() {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useGlobalTimer must be used inside TimerProvider");
  }

  return context;
}
