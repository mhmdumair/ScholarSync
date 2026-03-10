// components/WeeklyGrid.tsx
"use client";

import { useClock } from "@/hooks/useClock";
import { DAYS, formatTime12, getLectureStatus } from "@/lib/time";
import type { LectureCardData } from "./LectureCard";

interface Props {
  lectures: LectureCardData[];
  onEdit: (lecture: LectureCardData) => void;
  onSlotClick: (dayOfWeek: number, startTime: string) => void;
}

const HOUR_START = 7;
const HOUR_END   = 22;
const SLOT_MINS  = 30;
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60;
const NUM_SLOTS  = (TOTAL_MINS) / SLOT_MINS;        // 30 slots
const SLOT_H     = 36;                               // px per slot
const GRID_H     = NUM_SLOTS * SLOT_H;               // 1080px total

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function pad(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function WeeklyGrid({ lectures, onEdit, onSlotClick }: Props) {
  const now      = useClock();
  const todayDay = now.getDay();
  const nowMins  = now.getHours() * 60 + now.getMinutes();

  // Build slot labels (every hour on the half-hour)
  const slots = Array.from({ length: NUM_SLOTS }, (_, i) => {
    const totalMins = HOUR_START * 60 + i * SLOT_MINS;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return { h, m, label: m === 0 ? formatTime12(pad(h, m)) : "" };
  });

  return (
    <div className="surface overflow-hidden">
      {/* Day header row */}
      <div
        className="grid border-b border-[var(--border)] sticky top-0 z-20 bg-white"
        style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
      >
        <div className="p-2" />
        {DAYS.map((day, i) => (
          <div
            key={i}
            className={`py-3 text-center border-l border-[var(--border)] ${
              i === todayDay ? "" : ""
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-widest ${
              i === todayDay ? "text-[var(--accent)]" : "text-[var(--tx-3)]"
            }`}>
              {day.slice(0, 3)}
            </span>
            {i === todayDay && (
              <div className="flex justify-center mt-1">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable grid body */}
      <div className="overflow-y-auto" style={{ maxHeight: "540px" }}>
        <div
          className="grid relative"
          style={{ gridTemplateColumns: "52px repeat(7, 1fr)", height: GRID_H }}
        >
          {/* Hour labels column */}
          <div className="relative">
            {slots.map((s, i) => (
              <div
                key={i}
                className="absolute right-0 pr-2 flex items-start justify-end"
                style={{ top: i * SLOT_H, height: SLOT_H }}
              >
                {s.label && (
                  <span className="text-[10px] font-mono text-[var(--tx-3)] -translate-y-1.5">
                    {s.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIdx) => (
            <div
              key={dayIdx}
              className={`relative border-l border-[var(--border)] ${
                dayIdx === todayDay ? "bg-indigo-50/20" : ""
              }`}
              style={{ height: GRID_H }}
            >
              {/* Individual 30-min clickable slot cells */}
              {slots.map((s, slotIdx) => {
                const slotStartMins = s.h * 60 + s.m;
                const isHalfHour    = s.m === 30;
                return (
                  <div
                    key={slotIdx}
                    className="slot-cell absolute left-0 right-0 group/slot"
                    style={{
                      top:    slotIdx * SLOT_H,
                      height: SLOT_H,
                      borderTop: `1px ${isHalfHour ? "dashed" : "solid"} var(--border)`,
                      borderTopColor: isHalfHour
                        ? "rgba(0,0,0,0.05)"
                        : "var(--border)",
                    }}
                    onClick={() => onSlotClick(dayIdx, pad(s.h, s.m))}
                    title={`Add at ${formatTime12(pad(s.h, s.m))}`}
                  >
                    {/* Time tooltip on hover */}
                    <span className="absolute left-1 top-0.5 text-[9px] font-mono text-[var(--accent)] opacity-0 group-hover/slot:opacity-100 transition-opacity pointer-events-none z-20 bg-white px-1 rounded shadow-sm border border-[var(--border)]">
                      {formatTime12(pad(s.h, s.m))}
                    </span>
                  </div>
                );
              })}

              {/* Current time red line */}
              {dayIdx === todayDay &&
                nowMins >= HOUR_START * 60 &&
                nowMins <= HOUR_END * 60 && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{
                      top: ((nowMins - HOUR_START * 60) / TOTAL_MINS) * GRID_H,
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shrink-0 shadow-sm" />
                      <div className="flex-1 h-px bg-red-500 opacity-70" />
                    </div>
                  </div>
                )}

              {/* Lecture blocks */}
              {lectures
                .filter(l => l.dayOfWeek === dayIdx)
                .map(lecture => {
                  const startMins = toMinutes(lecture.startTime);
                  const endMins   = toMinutes(lecture.endTime);
                  const topPx  = ((startMins - HOUR_START * 60) / TOTAL_MINS) * GRID_H;
                  const heightPx = Math.max(((endMins - startMins) / TOTAL_MINS) * GRID_H, SLOT_H);
                  const status = getLectureStatus(dayIdx, lecture.startTime, lecture.endTime, now);
                  const isLive = status.urgency === "live";

                  return (
                    <button
                      key={lecture.id}
                      onClick={e => { e.stopPropagation(); onEdit(lecture); }}
                      className={`absolute left-0.5 right-0.5 z-10 rounded-lg text-left overflow-hidden transition-all hover:z-20 hover:shadow-lg hover:scale-[1.02] focus:outline-none ${
                        isLive ? "ring-1 ring-green-400" : ""
                      }`}
                      style={{
                        top: topPx + 1,
                        height: heightPx - 2,
                        background: `${lecture.color}18`,
                        borderLeft: `3px solid ${lecture.color}`,
                      }}
                      title={`${lecture.title} · ${formatTime12(lecture.startTime)}`}
                    >
                      <div className="px-1.5 py-1">
                        <p
                          className="text-[10px] font-bold leading-tight truncate"
                          style={{ color: lecture.color }}
                        >
                          {lecture.title}
                        </p>
                        {heightPx > 40 && (
                          <p className="text-[9px] text-[var(--tx-3)] font-mono mt-0.5 truncate">
                            {formatTime12(lecture.startTime)}
                          </p>
                        )}
                        {isLive && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
        <p className="text-[11px] text-[var(--tx-3)]">
          Click any empty slot to add a lecture · Drag handles lectures
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--tx-3)]">
            <span className="w-2 h-px bg-red-500 inline-block" /> Now
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--tx-3)]">
            <span className="w-2 h-1.5 rounded-sm bg-[var(--accent)] inline-block opacity-20 border-l-2 border-[var(--accent)]" /> Lecture
          </span>
        </div>
      </div>
    </div>
  );
}
