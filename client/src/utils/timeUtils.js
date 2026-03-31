export function formatMinutesToHoursMinutes(totalMinutes = 0, format = "hmin") {
  const minutes = Number(totalMinutes || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return format === "decimal" ? "0h" : "0min";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (format === "decimal") {
    if (remainder === 0) {
      return `${hours}h`;
    }

    const decimalValue = Number((hours + remainder / 60).toFixed(1));
    return `${decimalValue}h`;
  }

  if (hours > 0) {
    return remainder > 0 ? `${hours}h ${remainder}min` : `${hours}h`;
  }

  return `${remainder}min`;
}
