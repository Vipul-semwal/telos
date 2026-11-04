/**
 * Daily planning constant: planned capacity is capped at 4 hours.
 * 4 hours = 4 * 3600 = 14,400 seconds.
 */
export const MAX_DAILY_PLANNED_SECONDS = 14400;

/**
 * Format integer seconds into strict HH:MM:SS format for timers.
 */
export function formatSecondsToClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format integer seconds into human readable short representation (e.g. "2h 30m", "45m").
 */
export function formatSecondsToHuman(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  if (safeSeconds < 60) {
    return `${safeSeconds}s`;
  }
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * ETA Status calculation:
 * - Green: actual duration is less than or equal to the estimate.
 * - Red: actual duration strictly exceeds the estimate.
 * If estimate is 0 and work is logged, defaults to green until estimate is set.
 */
export function calculateEtaStatus(
  actualSeconds: number,
  estimatedSeconds: number,
): "green" | "red" {
  if (estimatedSeconds <= 0) {
    return "green";
  }
  return actualSeconds <= estimatedSeconds ? "green" : "red";
}
