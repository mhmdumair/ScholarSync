// components/ItemModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { addItem, updateItem } from "@/app/actions/items";
import type { ItemType, ItemFormData } from "@/app/actions/items";
import type { ItemData } from "./ItemCard";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ItemData | null;
  defaultType?: ItemType;
}

const TYPES: { id: ItemType; label: string; icon: string; color: string }[] = [
  { id: "assignment", label: "Assignment", icon: "📝", color: "#059669" },
  { id: "tutorial",  label: "Tutorial",   icon: "📖", color: "#0284c7" },
  { id: "quiz",      label: "Quiz",       icon: "⚡", color: "#7c3aed" },
  { id: "exam",      label: "Exam",       icon: "🎓", color: "#dc2626" },
  { id: "event",     label: "Event",      icon: "🔔", color: "#d97706" },
];

const COLORS = ["#5046e5","#059669","#0284c7","#7c3aed","#dc2626","#d97706","#db2777","#0891b2"];
const PRIORITIES = ["low","medium","high"] as const;

const defaultForm = (type: ItemType = "assignment"): ItemFormData => ({
  type, title: "", course: "", description: "",
  dueDate: "", eventDate: "", location: "", priority: "medium", color: "#5046e5",
});

export function ItemModal({ isOpen, onClose, editItem, defaultType = "assignment" }: Props) {
  const [form, setForm] = useState<ItemFormData>(defaultForm(defaultType));
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editItem) {
      setForm({
        type: editItem.type as ItemType,
        title: editItem.title,
        course: editItem.course ?? "",
        description: editItem.description ?? "",
        dueDate: editItem.dueDate ? new Date(editItem.dueDate).toISOString().slice(0,16) : "",
        eventDate: editItem.eventDate ? new Date(editItem.eventDate).toISOString().slice(0,16) : "",
        location: editItem.location ?? "",
        priority: editItem.priority as any,
        color: editItem.color,
      });
    } else {
      setForm(defaultForm(defaultType));
    }
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [editItem, isOpen, defaultType]);

  const set = (k: keyof ItemFormData, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      if (editItem) {
        await updateItem(editItem.id, form);
        toast.success("Updated!");
      } else {
        await addItem(form);
        toast.success("Added!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentType = TYPES.find(t => t.id === form.type)!;
  const showEventDate = ["quiz","exam","event"].includes(form.type);
  const showDueDate = ["assignment","tutorial","quiz","exam"].includes(form.type);
  const showLocation = ["quiz","exam","event","tutorial"].includes(form.type);

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentType.icon}</span>
            <div>
              <h2 className="font-bold text-[var(--tx-1)] text-base leading-tight">
                {editItem ? `Edit ${currentType.label}` : `New ${currentType.label}`}
              </h2>
              <p className="text-xs text-[var(--tx-3)] mt-0.5">Fill in the details below</p>
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

            {/* Type selector */}
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-5 gap-1.5">
                {TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set("type", t.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all border ${
                      form.type === t.id
                        ? "border-transparent text-white shadow-sm"
                        : "border-[var(--border)] text-[var(--tx-2)] hover:border-[var(--border-2)] bg-white"
                    }`}
                    style={form.type === t.id ? { background: t.color } : {}}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="leading-tight text-center">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label">Title *</label>
              <input
                ref={titleRef}
                className="field"
                placeholder={`e.g. ${form.type === "assignment" ? "Calculus Problem Set 3" : form.type === "quiz" ? "Mid-term Quiz" : form.type === "exam" ? "Final Exam" : "Study Group Meeting"}`}
                value={form.title}
                onChange={e => set("title", e.target.value)}
                required
              />
            </div>

            {/* Course */}
            <div>
              <label className="label">Course / Subject</label>
              <input
                className="field"
                placeholder="e.g. Mathematics, Physics"
                value={form.course}
                onChange={e => set("course", e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description / Notes</label>
              <textarea
                className="field"
                rows={3}
                placeholder="Add any details, chapters to study, instructions..."
                value={form.description}
                onChange={e => set("description", e.target.value)}
              />
            </div>

            {/* Event date (when it happens) */}
            {showEventDate && (
              <div>
                <label className="label">
                  {form.type === "event" ? "Event Date & Time" : `${currentType.label} Date & Time`}
                </label>
                <input
                  type="datetime-local"
                  className="field font-mono"
                  value={form.eventDate}
                  onChange={e => set("eventDate", e.target.value)}
                />
              </div>
            )}

            {/* Due date */}
            {showDueDate && (
              <div>
                <label className="label">
                  {form.type === "quiz" || form.type === "exam" ? "Submission / Deadline" : "Due Date & Time"}
                </label>
                <input
                  type="datetime-local"
                  className="field font-mono"
                  value={form.dueDate}
                  onChange={e => set("dueDate", e.target.value)}
                />
              </div>
            )}

            {/* Location */}
            {showLocation && (
              <div>
                <label className="label">Location / Room</label>
                <input
                  className="field"
                  placeholder="e.g. Hall A, Room 202, Online"
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                />
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="label">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority", p)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all border ${
                      form.priority === p
                        ? p === "low" ? "bg-[#f4f4f5] text-[#52525b] border-[#d4d4d8]"
                          : p === "medium" ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-red-100 text-red-700 border-red-300"
                        : "border-[var(--border)] text-[var(--tx-3)] hover:border-[var(--border-2)] bg-white"
                    }`}
                  >
                    {p === "low" ? "🔵" : p === "medium" ? "🟡" : "🔴"} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="label">Card Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-[var(--accent)]" : "hover:scale-110"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 border-t border-[var(--border)] sticky bottom-0 bg-white">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
              <button
                type="submit"
                disabled={loading || !form.title.trim()}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : editItem ? "Save Changes" : `Add ${currentType.label}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
