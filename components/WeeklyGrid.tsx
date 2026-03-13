// components/WeeklyGrid.tsx
"use client";

import { useClock } from "@/hooks/useClock";
import { DAYS, formatTime12 } from "@/lib/time";
import type { LectureCardData } from "./LectureCard";

interface Props {
  lectures: LectureCardData[];
  onEdit: (ids: string[], lecture: LectureCardData) => void;  // ids = all merged block ids
  onSlotClick: (dayOfWeek: number, startTime: string, endTime: string) => void;
  onDelete?: (ids: string[]) => void;
  onFreeSlot?: (ids: string[]) => void;
}

// ─── Constants ───────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END_DEFAULT = 18;   // grid ends at 6 PM unless lectures go beyond
const SLOT_H = 48;             // px per 1-hour row
const DISPLAY_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri only

// ─── Helpers ─────────────────────────────────────────────────
function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function htime(h: number) {
  return `${pad2(h)}:00`;
}

/** Compute where the grid should end — max of 18 and any lecture's end hour */
function getHourEnd(lectures: LectureCardData[]): number {
  let max = HOUR_END_DEFAULT;
  lectures.forEach((l) => {
    const h = parseInt(l.endTime.split(":")[0], 10);
    if (h > max) max = h;
  });
  return max;
}

/**
 * Auto-merge adjacent same-title same-color lectures on a day into visual blocks.
 * Each block carries the ids of all constituent lectures so bulk-delete/edit works.
 */
interface MergedBlock {
  ids: string[];
  title: string;
  color: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  // pass-through for edit modal
  location?: string;
  instructor?: string;
}

function autoMergedBlocks(
  lectures: LectureCardData[],
  dayIdx: number
): MergedBlock[] {
  const dl = lectures
    .filter((l) => l.dayOfWeek === dayIdx)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const blocks: MergedBlock[] = [];
  let i = 0;
  while (i < dl.length) {
    const base = dl[i];
    const block: MergedBlock = {
      ids: [base.id],
      title: base.title,
      color: base.color,
      dayOfWeek: dayIdx,
      startTime: base.startTime,
      endTime: base.endTime,
      location: (base as any).location,
      instructor: (base as any).instructor,
    };
    let j = i + 1;
    while (
      j < dl.length &&
      dl[j].title === base.title &&
      dl[j].color === base.color &&
      dl[j - 1].endTime === dl[j].startTime
    ) {
      block.ids.push(dl[j].id);
      block.endTime = dl[j].endTime;
      j++;
    }
    blocks.push(block);
    i = j;
  }
  return blocks;
}

// ─── Component ───────────────────────────────────────────────
export function WeeklyGrid({
  lectures,
  onEdit,
  onSlotClick,
  onDelete,
  onFreeSlot,
}: Props) {
  const now = useClock();
  const todayDay = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const HOUR_END = getHourEnd(lectures);
  const TOTAL_HOURS = HOUR_END - HOUR_START;
  const GRID_H = TOTAL_HOURS * SLOT_H;
  const hourSlots = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-white shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* ── Day header ── */}
          <div
            className="grid border-b border-[var(--border)] sticky top-0 z-20 bg-white"
            style={{ gridTemplateColumns: `64px repeat(${DISPLAY_DAYS.length}, 1fr)` }}
          >
            <div className="border-r border-[var(--border)] bg-gray-50" />
            {DISPLAY_DAYS.map((dayIdx) => (
              <div
                key={dayIdx}
                className="py-3 text-center border-l border-[var(--border)]"
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${
                    dayIdx === todayDay ? "text-blue-600" : "text-[var(--tx-3)]"
                  }`}
                >
                  {DAYS[dayIdx].slice(0, 3)}
                </span>
                {dayIdx === todayDay && (
                  <div className="flex justify-center mt-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>

      {/* ── Grid body ── */}
      <div className="overflow-y-auto" style={{ maxHeight: "580px" }}>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `64px repeat(${DISPLAY_DAYS.length}, 1fr)`,
            height: GRID_H,
          }}
        >
          {/* Time labels — one per hour, centered in row */}
          <div className="relative border-r border-[var(--border)] bg-gray-50">
            {hourSlots.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-center justify-center border-b border-gray-200"
                style={{ top: (h - HOUR_START) * SLOT_H, height: SLOT_H }}
              >
                <span className="text-[10px] font-mono font-semibold text-[var(--tx-3)] pointer-events-none">
                  {formatTime12(htime(h))}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DISPLAY_DAYS.map((dayIdx) => {
            const isToday = dayIdx === todayDay;
            const mergedBlocks = autoMergedBlocks(lectures, dayIdx);

            return (
              <div
                key={dayIdx}
                className={`relative border-l border-[var(--border)] ${
                  isToday ? "bg-blue-50/20" : ""
                }`}
                style={{ height: GRID_H }}
              >
                {/* Hour slot rows — clearly visible, click to add */}
                {hourSlots.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 group/slot cursor-pointer hover:bg-blue-50/70 transition-colors border-b border-gray-200 flex items-center justify-center"
                    style={{
                      top: (h - HOUR_START) * SLOT_H,
                      height: SLOT_H,
                      backgroundColor:
                        h % 2 === 0 ? "rgba(0,0,0,0.013)" : undefined,
                    }}
                    onClick={() => onSlotClick(dayIdx, htime(h), htime(h + 1))}
                    title={`Add at ${formatTime12(htime(h))}`}
                  >
                    <span className="opacity-0 group-hover/slot:opacity-100 transition-opacity pointer-events-none text-[10px] font-semibold text-blue-600 bg-white/95 border border-blue-200 px-2 py-0.5 rounded-full">
                      + {formatTime12(htime(h))}
                    </span>
                  </div>
                ))}

                {/* Current-time red line */}
                {isToday &&
                  nowMins >= HOUR_START * 60 &&
                  nowMins <= HOUR_END * 60 && (
                    <div
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      style={{
                        top:
                          ((nowMins - HOUR_START * 60) / (TOTAL_HOURS * 60)) *
                          GRID_H,
                      }}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shrink-0" />
                      <div className="flex-1 h-[1.5px] bg-red-500 opacity-80" />
                    </div>
                  )}

                {/* Auto-merged lecture blocks */}
                {mergedBlocks.map((block) => {
                  const sm = toMinutes(block.startTime);
                  const em = toMinutes(block.endTime);
                  if (sm >= HOUR_END * 60 || em <= HOUR_START * 60) return null;

                  const cs = Math.max(sm, HOUR_START * 60);
                  const ce = Math.min(em, HOUR_END * 60);
                  const topPx =
                    ((cs - HOUR_START * 60) / (TOTAL_HOURS * 60)) * GRID_H;
                  const heightPx = Math.max(
                    ((ce - cs) / (TOTAL_HOURS * 60)) * GRID_H,
                    SLOT_H * 0.85
                  );

                  // Representative lecture for edit modal
                  const rep = lectures.find((l) => l.id === block.ids[0])!;

                  return (
                    <div
                      key={block.ids.join("-")}
                      className="absolute left-0.5 right-0.5 z-10 rounded overflow-hidden group/block hover:z-20 transition-all"
                      style={{
                        top: topPx,
                        height: heightPx,
                        background: block.color,
                      }}
                    >
                      {/* Subtle inner shading */}
                      <div className="absolute inset-0 bg-black/10 group-hover/block:bg-black/5 transition-colors pointer-events-none" />

                      {/* Delete button — top-right on hover */}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(block.ids);
                          }}
                          className="absolute top-1 right-1 z-20 w-5 h-5 rounded flex items-center justify-center bg-black/25 text-white opacity-0 group-hover/block:opacity-100 transition-opacity hover:bg-red-500/80"
                          title="Delete"
                        >
                          <svg className="w-2.5 h-2.5" viewBox="0 0 8 8" fill="none">
                            <path
                              d="M1 1l6 6M7 1L1 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Edit — click anywhere on block */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(block.ids, {
                            ...rep,
                            startTime: block.startTime,
                            endTime: block.endTime,
                          });
                        }}
                        className="absolute inset-0 w-full text-left"
                        title={`${block.title} · ${formatTime12(block.startTime)}–${formatTime12(block.endTime)}`}
                      >
                        <div className="relative px-2.5 py-1.5 h-full flex flex-col justify-center">
                          <p className="text-[11px] font-semibold leading-tight line-clamp-3 text-white drop-shadow-sm">
                            {block.title}
                          </p>
                          {heightPx > 38 && (
                            <p className="text-[9px] font-medium opacity-80 font-mono mt-1 text-white">
                              {formatTime12(block.startTime)} – {formatTime12(block.endTime)}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
        <p className="text-[11px] text-[var(--tx-3)]">
          Click a slot to add · Hover a lecture to edit or delete
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--tx-3)]">
            <span className="w-3 h-px bg-red-500 inline-block" /> Now
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--tx-3)]">
            <span className="w-3 h-2.5 rounded-sm bg-blue-500 inline-block opacity-40" /> Lecture
          </span>
        </div>
      </div>
    </div>
  );
}