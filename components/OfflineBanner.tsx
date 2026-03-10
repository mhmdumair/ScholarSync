// components/OfflineBanner.tsx
"use client";

import { useOffline } from "@/hooks/useOffline";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="offline-banner fixed top-0 inset-x-0 z-50 bg-amber-500/90 text-black text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
      </svg>
      You&apos;re offline — showing cached timetable
    </div>
  );
}
