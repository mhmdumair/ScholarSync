// lib/time.ts
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface TimeStatus {
  label: string;
  color: string;
  urgency: "live" | "upcoming" | "soon" | "done" | "deadline";
  countdown: string;
  progress?: number; // 0-100 for live classes
}

/** Convert "HH:MM" to minutes since midnight */
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Format a seconds count into human-readable string */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Format "HH:MM" → "9:00 AM" */
export function formatTime12(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Get human-readable duration between two "HH:MM" strings */
export function getDuration(startTime: string, endTime: string): string {
  const totalMins = toMinutes(endTime) - toMinutes(startTime);
  if (totalMins <= 0) return "";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Get deadline countdown string */
export function getDeadlineCountdown(deadline: Date, now: Date): string {
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return "Overdue!";
  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

/** Compute full status for a lecture given current time */
export function getLectureStatus(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  now: Date,
  deadline?: Date | null
): TimeStatus {
  const todayDay = now.getDay();
  const isToday = dayOfWeek === todayDay;

  if (!isToday) {
    if (deadline) {
      const secsToDeadline = Math.floor((deadline.getTime() - now.getTime()) / 1000);
      if (secsToDeadline > 0 && secsToDeadline < 172800) {
        return {
          label: "Deadline Soon",
          color: "#ef4444",
          urgency: "deadline",
          countdown: getDeadlineCountdown(deadline, now),
        };
      }
    }
    return {
      label: DAYS[dayOfWeek],
      color: "#555577",
      urgency: "done",
      countdown: DAYS[dayOfWeek],
    };
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const startMins = toMinutes(startTime);
  const endMins = toMinutes(endTime);
  const startSecs = startMins * 60;
  const endSecs = endMins * 60;
  const totalSecs = endSecs - startSecs;

  // Currently in class
  if (nowSecs >= startSecs && nowSecs < endSecs) {
    const elapsed = nowSecs - startSecs;
    const remaining = endSecs - nowSecs;
    const progress = Math.round((elapsed / totalSecs) * 100);
    return {
      label: "In Progress",
      color: "#22c55e",
      urgency: "live",
      countdown: `${formatCountdown(remaining)} left`,
      progress,
    };
  }

  // Ended today
  if (nowSecs >= endSecs) {
    return {
      label: "Ended",
      color: "#555577",
      urgency: "done",
      countdown: "Done",
    };
  }

  // Starting soon (< 30 min)
  const secsToStart = startSecs - nowSecs;
  if (secsToStart < 1800) {
    return {
      label: "Starting Soon",
      color: "#f59e0b",
      urgency: "soon",
      countdown: `in ${formatCountdown(secsToStart)}`,
    };
  }

  // Upcoming today
  return {
    label: "Upcoming",
    color: "#6366f1",
    urgency: "upcoming",
    countdown: `in ${formatCountdown(secsToStart)}`,
  };
}
