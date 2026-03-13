// components/LectureModal.tsx
"use client";

import { useState, useEffect } from "react";
import { addLecture, updateLecture, deleteLecture, LectureFormData } from "@/app/actions/lectures";
import { DAYS } from "@/lib/time";
import toast from "react-hot-toast";
import type { LectureCardData } from "./LectureCard";

const COLORS = ["#5046e5","#059669","#0284c7","#7c3aed","#dc2626","#d97706","#db2777","#0891b2"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editLecture?: LectureCardData | null;
  defaultDay?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

function makeEndTime(startTime: string): string {
  const h = parseInt(startTime.split(":")[0], 10);
  return `${String(h + 1).padStart(2, "0")}:00`;
}

const defaultForm = (day?: number, startTime?: string, endTime?: string): LectureFormData => {
  const st = startTime ?? "09:00";
  return {
    title: "",
    subject: "",
    dayOfWeek: day ?? new Date().getDay(),
    startTime: st,
    endTime: endTime ?? makeEndTime(st),
    location: "",
    instructor: "",
    color: "#5046e5",
    deadline: "",
    notes: "",
  };
};

export function LectureModal({ isOpen, onClose, editLecture, defaultDay, defaultStartTime, defaultEndTime }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<LectureFormData>(
    defaultForm(defaultDay, defaultStartTime, defaultEndTime)
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editLecture) {
      setForm({
        title:      editLecture.title       ?? "",
        subject:    editLecture.subject     ?? "",
        dayOfWeek:  editLecture.dayOfWeek,
        startTime:  editLecture.startTime   ?? "09:00",
        endTime:    editLecture.endTime     ?? "10:00",
        location:   editLecture.location    ?? "",   // ← was possibly undefined
        instructor: editLecture.instructor  ?? "",   // ← was possibly undefined
        color:      editLecture.color       ?? "#5046e5",
        deadline:   editLecture.deadline
                      ? new Date(editLecture.deadline).toISOString().slice(0, 16)
                      : "",                          // ← was possibly undefined
        notes:      editLecture.notes       ?? "",   // ← was possibly undefined
      });
    } else {
      setForm(defaultForm(defaultDay, defaultStartTime, defaultEndTime));
    }
  }, [editLecture, isOpen, defaultDay, defaultStartTime, defaultEndTime]);

  const set = (k: keyof LectureFormData, v: any) =>
    setForm(p => ({ ...p, [k]: v }));

  const timeInvalid =
    !!form.startTime && !!form.endTime && form.startTime >= form.endTime;

  const handleDelete = async () => {
    if (!editLecture) return;
    if (!confirm(`Free the slot for "${editLecture.title}"?`)) return;
    setLoading(true);
    try {
      const idsToDelete = (editLecture as any).ids || [editLecture.id];
      await Promise.all(idsToDelete.map((id: string) => deleteLecture(id)));
      toast.success("Slot freed!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to free slot");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeInvalid) { toast.error("Start must be before end"); return; }
    setLoading(true);
    try {
      if (editLecture) {
        await updateLecture(editLecture.id, form);
        toast.success("Updated!");
      } else {
        await addLecture(form);
        toast.success("Lecture added!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📅</span>
            <div>
              <h2 className="font-bold text-[var(--tx-1)] text-base">
                {editLecture ? "Edit Lecture" : "New Lecture"}
              </h2>
              <p className="text-xs text-[var(--tx-3)] mt-0.5">Recurring weekly class slot</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Title & Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Lecture Title *</label>
                <input
                  className="field"
                  placeholder="e.g. Calculus I"
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Subject *</label>
                <input
                  className="field"
                  placeholder="e.g. Mathematics"
                  value={form.subject}
                  onChange={e => set("subject", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Day */}
            <div>
              <label className="label">Day of Week</label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set("dayOfWeek", i)}
                    className={`py-2 text-xs rounded-lg font-bold transition-all border ${
                      form.dayOfWeek === i
                        ? "bg-[var(--accent)] text-white border-transparent"
                        : "bg-white border-[var(--border)] text-[var(--tx-3)] hover:border-[var(--border-2)] hover:text-[var(--tx-1)]"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Time</label>
                <input
                  type="time"
                  className={`field font-mono ${timeInvalid ? "border-red-400" : ""}`}
                  value={form.startTime}
                  onChange={e => set("startTime", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">End Time</label>
                <input
                  type="time"
                  className={`field font-mono ${timeInvalid ? "border-red-400" : ""}`}
                  value={form.endTime}
                  onChange={e => set("endTime", e.target.value)}
                  required
                />
              </div>
            </div>
            {timeInvalid && (
              <p className="text-red-600 text-xs -mt-3">⚠ Start must be before end time</p>
            )}

            {/* Location & Instructor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Room / Location</label>
                <input
                  className="field"
                  placeholder="e.g. Room 204"
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Instructor</label>
                <input
                  className="field"
                  placeholder="e.g. Dr. Smith"
                  value={form.instructor}
                  onChange={e => set("instructor", e.target.value)}
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="label">
                Assignment Deadline{" "}
                <span className="text-[var(--tx-3)] normal-case font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                className="field font-mono"
                value={form.deadline}
                onChange={e => set("deadline", e.target.value)}
              />
            </div>

            {/* Color */}
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      form.color === c
                        ? "ring-2 ring-offset-2 ring-[var(--accent)]"
                        : "hover:scale-110"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Free slot button — shown only in edit mode */}
            {editLecture && (
              <div>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Free this slot
                </button>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea
                className="field"
                rows={2}
                placeholder="Any extra info..."
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="px-5 pb-5 pt-3 border-t border-[var(--border)] sticky bottom-0 bg-white">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !form.title || !form.subject || timeInvalid}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : editLecture ? "Save Changes" : "Add Lecture"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}