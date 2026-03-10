// components/ItemCard.tsx
"use client";

import { useState } from "react";
import { toggleItemStatus, deleteItem } from "@/app/actions/items";
import toast from "react-hot-toast";
import type { ItemType } from "@/app/actions/items";

export interface ItemData {
  id: string;
  type: string;
  title: string;
  course: string | null;
  description: string | null;
  dueDate: string | null;
  eventDate: string | null;
  location: string | null;
  priority: string;
  status: string;
  color: string;
}

interface Props {
  item: ItemData;
  onEdit: (item: ItemData) => void;
  onRefresh: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  assignment: "Assignment",
  tutorial: "Tutorial",
  quiz: "Quiz",
  exam: "Exam",
  event: "Event",
};

const TYPE_ICONS: Record<string, string> = {
  assignment: "📝",
  tutorial: "📖",
  quiz: "⚡",
  exam: "🎓",
  event: "🔔",
};

function timeUntil(dateStr: string | null, label: string): { text: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const past = diff < 0;

  const days = Math.floor(abs / 86400000);
  const hrs = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);

  let text = "";
  if (days > 0) text = `${days}d ${hrs}h`;
  else if (hrs > 0) text = `${hrs}h ${mins}m`;
  else if (mins > 0) text = `${mins}m`;
  else text = "Now";

  return {
    text: past ? `${label} overdue` : `${label} in ${text}`,
    urgent: diff < 86400000 * 2 && !past,
  };
}

export function ItemCard({ item, onEdit, onRefresh }: Props) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDone = item.status === "done";

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await toggleItemStatus(item.id);
      onRefresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteItem(item.id);
      toast.success("Deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  const dueMeta = timeUntil(item.dueDate, "Due");
  const eventMeta = timeUntil(item.eventDate, TYPE_LABELS[item.type] || item.type);

  return (
    <div
      className={`surface group relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md ${isDone ? "opacity-55" : ""}`}
      style={{ borderLeftColor: item.color, borderLeftWidth: "3px" }}
      onClick={() => onEdit(item)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`mt-0.5 w-4.5 h-4.5 flex-shrink-0 rounded-md border-2 transition-all flex items-center justify-center ${
              isDone
                ? "bg-emerald-500 border-emerald-500"
                : "border-[var(--border-2)] hover:border-[var(--accent)]"
            }`}
            style={{ width: 18, height: 18 }}
            title={isDone ? "Mark pending" : "Mark done"}
          >
            {isDone && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge badge-${item.type}`}>
                {TYPE_ICONS[item.type]} {TYPE_LABELS[item.type] || item.type}
              </span>
              <span className={`badge badge-${item.priority}`}>
                {item.priority}
              </span>
            </div>

            <h3 className={`font-semibold text-sm text-[var(--tx-1)] leading-snug ${isDone ? "line-through text-[var(--tx-3)]" : ""}`}>
              {item.title}
            </h3>
            {item.course && (
              <p className="text-xs text-[var(--tx-3)] mt-0.5">{item.course}</p>
            )}
            {item.description && !isDone && (
              <p className="text-xs text-[var(--tx-2)] mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
            )}

            {/* Dates */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {eventMeta && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                  eventMeta.urgent ? "bg-amber-50 text-amber-700" : "bg-[var(--surface-2)] text-[var(--tx-2)]"
                }`}>
                  🗓 {eventMeta.text}
                </span>
              )}
              {dueMeta && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                  dueMeta.urgent ? "bg-red-50 text-red-700" : "bg-[var(--surface-2)] text-[var(--tx-2)]"
                }`}>
                  ⏰ {dueMeta.text}
                </span>
              )}
              {item.location && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--tx-3)] px-2 py-0.5 rounded-md bg-[var(--surface-2)]">
                  📍 {item.location}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(item)} className="btn-icon" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-icon hover:!text-red-600 hover:!bg-red-50" title="Delete">
              {deleting ? (
                <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin block" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
