// components/NextClassWidget.tsx
"use client";

import { useClock } from "@/hooks/useClock";
import { getLectureStatus, formatTime12, DAYS } from "@/lib/time";
import type { LectureCardData } from "./LectureCard";

interface Props { lectures: LectureCardData[]; }

export function NextClassWidget({ lectures }: Props) {
  const now = useClock();

  if (!lectures.length) return null;

  const liveClass = lectures.find(l => getLectureStatus(l.dayOfWeek, l.startTime, l.endTime, now).urgency === "live");
  const upcoming = lectures
    .filter(l => { const s = getLectureStatus(l.dayOfWeek, l.startTime, l.endTime, now); return s.urgency === "upcoming" || s.urgency === "soon"; })
    .sort((a,b) => a.startTime.localeCompare(b.startTime))[0];

  const featured = liveClass || upcoming;
  if (!featured) return (
    <div className="surface p-4 flex items-center gap-3">
      <span className="text-2xl">🎉</span>
      <div>
        <p className="font-semibold text-[var(--tx-1)] text-sm">All done for today!</p>
        <p className="text-xs text-[var(--tx-3)]">No more classes. Rest up!</p>
      </div>
    </div>
  );

  const deadline = featured.deadline ? new Date(featured.deadline) : null;
  const status = getLectureStatus(featured.dayOfWeek, featured.startTime, featured.endTime, now, deadline);
  const isLive = status.urgency === "live";

  return (
    <div className="surface overflow-hidden" style={{ borderLeftColor: featured.color, borderLeftWidth: "4px" }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: `radial-gradient(circle at left, ${featured.color}, transparent 60%)` }} />
      <div className="p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`badge ${isLive ? "badge-live" : "badge-next"}`}>
            {isLive ? (
              <><span className="pulse inline-block w-1.5 h-1.5 rounded-full bg-green-500" /> Live Now</>
            ) : "Next Up"}
          </span>
          <span className="text-xs text-[var(--tx-3)]">{DAYS[featured.dayOfWeek]}</span>
        </div>
        <h3 className="text-lg font-bold text-[var(--tx-1)]">{featured.title}</h3>
        <p className="text-sm text-[var(--tx-2)]">{featured.subject}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-[var(--tx-3)] mb-0.5">{isLive ? "Ends in" : "Starts in"}</p>
            <p className={`font-mono text-2xl font-bold ${isLive ? "text-green-600" : "text-[var(--accent)]"}`}>
              {status.countdown.replace(" left","").replace("in ","")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-[var(--tx-2)]">{formatTime12(featured.startTime)} – {formatTime12(featured.endTime)}</p>
            {featured.location && <p className="text-xs text-[var(--tx-3)] mt-0.5">📍 {featured.location}</p>}
          </div>
        </div>
        {isLive && status.progress !== undefined && (
          <div className="mt-3">
            <div className="progress-bar">
              <div className="h-full rounded-full transition-all duration-1000 bg-green-500" style={{ width: `${status.progress}%` }} />
            </div>
            <p className="text-[10px] text-[var(--tx-3)] mt-1 text-right">{status.progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}
