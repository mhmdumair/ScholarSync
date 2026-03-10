// components/LectureCard.tsx
"use client";

import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { getLectureStatus, formatTime12, getDuration } from "@/lib/time";
import { deleteLecture } from "@/app/actions/lectures";
import toast from "react-hot-toast";

export interface LectureCardData {
  id: string;
  title: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  instructor: string | null;
  color: string;
  deadline: string | null;
  notes: string | null;
}

interface Props {
  lecture: LectureCardData;
  onEdit: (lecture: LectureCardData) => void;
  compact?: boolean;
}

export function LectureCard({ lecture, onEdit, compact = false }: Props) {
  const now = useClock();
  const [deleting, setDeleting] = useState(false);

  const deadline = lecture.deadline ? new Date(lecture.deadline) : null;
  const status = getLectureStatus(lecture.dayOfWeek, lecture.startTime, lecture.endTime, now, deadline);
  const isLive = status.urgency === "live";
  const isSoon = status.urgency === "soon";
  const isDone = status.urgency === "done";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove "${lecture.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteLecture(lecture.id);
      toast.success("Removed");
    } catch {
      toast.error("Failed");
      setDeleting(false);
    }
  };

  return (
    <div
      className={`surface group relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${isDone ? "opacity-55" : ""} ${isLive ? "ring-1 ring-green-400/60" : ""}`}
      style={{ borderLeftColor: lecture.color, borderLeftWidth: "3px" }}
      onClick={() => onEdit(lecture)}
    >
      {/* Live progress bar */}
      {isLive && status.progress !== undefined && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--border)]">
          <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${status.progress}%` }} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="badge badge-lecture">📅 Lecture</span>
              {isLive && <span className="badge badge-live"><span className="pulse inline-block w-1.5 h-1.5 bg-green-500 rounded-full" /> Live</span>}
              {isSoon && <span className="badge badge-soon">Soon</span>}
            </div>
            <h3 className="font-semibold text-sm text-[var(--tx-1)]">{lecture.title}</h3>
            <p className="text-xs text-[var(--tx-3)] mt-0.5">{lecture.subject}</p>
          </div>

          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(lecture)} className="btn-icon" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-icon hover:!text-red-600 hover:!bg-red-50" title="Delete">
              {deleting ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin block" /> : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--tx-2)] font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)]">
            🕐 {formatTime12(lecture.startTime)} – {formatTime12(lecture.endTime)}
            <span className="text-[var(--tx-3)]">·</span>
            {getDuration(lecture.startTime, lecture.endTime)}
          </span>
          {!compact && lecture.location && (
            <span className="text-[11px] text-[var(--tx-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)]">
              📍 {lecture.location}
            </span>
          )}
          {!compact && lecture.instructor && (
            <span className="text-[11px] text-[var(--tx-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)]">
              👤 {lecture.instructor}
            </span>
          )}
        </div>

        {/* Countdown */}
        <div className="mt-2.5">
          <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            isLive ? "bg-green-50 text-green-700"
            : isSoon ? "bg-amber-50 text-amber-700"
            : isDone ? "text-[var(--tx-3)]"
            : "text-[var(--tx-3)]"
          }`}>
            {status.countdown}
          </span>
        </div>

        {/* Progress bar for live */}
        {isLive && status.progress !== undefined && (
          <div className="mt-2.5">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${status.progress}%`, background: "#22c55e" }} />
            </div>
            <p className="text-[10px] text-[var(--tx-3)] mt-1 text-right">{status.progress}% complete</p>
          </div>
        )}

        {!compact && lecture.notes && (
          <p className="mt-2.5 text-[11px] text-[var(--tx-3)] italic border-t border-[var(--border)] pt-2 leading-relaxed">
            {lecture.notes}
          </p>
        )}
      </div>
    </div>
  );
}
