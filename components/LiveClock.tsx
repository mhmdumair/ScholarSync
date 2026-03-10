// components/LiveClock.tsx
"use client";

import { useClock } from "@/hooks/useClock";

export function LiveClock() {
  const now = useClock();

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="surface p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-[var(--tx-3)] font-semibold uppercase tracking-wider mb-1">Current Time</p>
        <div className="font-mono text-3xl font-bold text-[var(--tx-1)] tracking-tight">{timeStr}</div>
        <div className="text-sm text-[var(--tx-2)] mt-0.5">{dateStr}</div>
      </div>
      <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
        <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
}
