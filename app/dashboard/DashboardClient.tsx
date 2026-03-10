// app/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LiveClock } from "@/components/LiveClock";
import { LectureCard } from "@/components/LectureCard";
import type { LectureCardData } from "@/components/LectureCard";
import { LectureModal } from "@/components/LectureModal";
import { WeeklyGrid } from "@/components/WeeklyGrid";
import { NextClassWidget } from "@/components/NextClassWidget";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ItemCard } from "@/components/ItemCard";
import type { ItemData } from "@/components/ItemCard";
import { ItemModal } from "@/components/ItemModal";
import { GpaCalculator } from "@/components/GpaCalculator";
import { ProfileSettings } from "@/components/ProfileSettings";
import { cacheLectures, getCachedLectures } from "@/lib/offlineCache";
import { useOffline } from "@/hooks/useOffline";
import { DAYS } from "@/lib/time";
import type { ItemType } from "@/app/actions/items";

interface Props {
  user: { id: string; name: string | null; email: string | null; image: string | null };
  initialLectures: LectureCardData[];
  initialItems: ItemData[];
}

type Tab = "today" | "timetable" | "tasks" | "quizexams" | "events" | "gpa" | "profile";

const NAV: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: "today", label: "Today",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    id: "timetable", label: "Timetable",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    id: "tasks", label: "Tasks",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    id: "quizexams", label: "Quizzes & Exams",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
  },
  {
    id: "events", label: "Events",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    id: "gpa", label: "GPA Calculator",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  {
    id: "profile", label: "Profile",
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
];

export function DashboardClient({ user, initialLectures, initialItems }: Props) {
  const router = useRouter();
  const [lectures, setLectures] = useState<LectureCardData[]>(initialLectures);
  const [items, setItems] = useState<ItemData[]>(initialItems);
  const [tab, setTab] = useState<Tab>("today");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lectureModal, setLectureModal] = useState<{ open: boolean; edit: LectureCardData | null; day?: number; time?: string }>({ open: false, edit: null });
  const [itemModal, setItemModal] = useState<{ open: boolean; edit: ItemData | null; type?: ItemType }>({ open: false, edit: null });
  const isOffline = useOffline();
  const [isPending, startTransition] = useTransition();

  const todayDay = new Date().getDay();

  useEffect(() => { if (!isOffline) cacheLectures(lectures); }, [lectures, isOffline]);
  useEffect(() => {
    if (isOffline) getCachedLectures().then(c => { if (c.length) setLectures(c as LectureCardData[]); });
  }, [isOffline]);

  const refreshLectures = useCallback(async () => {
    if (isOffline) return;
    const res = await fetch("/api/lectures").catch(() => null);
    if (res?.ok) { const d = await res.json(); if (Array.isArray(d)) setLectures(d); }
    else startTransition(() => router.refresh());
  }, [isOffline, router]);

  const refreshItems = useCallback(async () => {
    const res = await fetch("/api/items").catch(() => null);
    if (res?.ok) { const d = await res.json(); if (Array.isArray(d)) setItems(d); }
    else startTransition(() => router.refresh());
  }, [router]);

  // Derived data
  const todayLectures = lectures.filter(l => l.dayOfWeek === todayDay).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const todayDueItems = items.filter(i => { if (!i.dueDate) return false; const d = new Date(i.dueDate); const now = new Date(); return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate(); });
  const taskItems = items.filter(i => i.type === "assignment" || i.type === "tutorial");
  const quizExamItems = items.filter(i => i.type === "quiz" || i.type === "exam").sort((a,b) => { const da = a.eventDate || a.dueDate || "9999"; const db = b.eventDate || b.dueDate || "9999"; return da.localeCompare(db); });
  const eventItems = items.filter(i => i.type === "event").sort((a,b) => { const da = a.eventDate || "9999"; const db = b.eventDate || "9999"; return da.localeCompare(db); });

  const pendingTasks = taskItems.filter(i => i.status === "pending");
  const doneTasks = taskItems.filter(i => i.status === "done");

  // Badge counts for nav
  const counts: Partial<Record<Tab, number>> = {
    tasks: pendingTasks.length,
    quizexams: quizExamItems.filter(i => i.status === "pending").length,
    events: eventItems.filter(i => i.status === "pending").length,
  };

  const SectionHeader = ({ title, count, onAdd, addLabel = "Add" }: { title: string; count?: number; onAdd?: () => void; addLabel?: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-[var(--tx-1)] text-base">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="bg-[var(--accent-light)] text-[var(--accent)] text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {onAdd && !isOffline && (
        <button onClick={onAdd} className="btn btn-primary text-xs py-1.5 px-3 gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          {addLabel}
        </button>
      )}
    </div>
  );

  const EmptyState = ({ icon, title, body, action, onAction }: { icon: string; title: string; body: string; action?: string; onAction?: () => void }) => (
    <div className="surface p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-bold text-[var(--tx-1)]">{title}</p>
      <p className="text-[var(--tx-3)] text-sm mt-1">{body}</p>
      {action && onAction && <button onClick={onAction} disabled={isOffline} className="btn btn-primary mt-5 disabled:opacity-40">{action}</button>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <OfflineBanner />

      {/* ─── Sidebar ─── */}
      <aside className={`sidebar fixed inset-y-0 left-0 z-40 w-60 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">ScholarSync</p>
              <p className="text-[var(--side-text)] text-[10px] mt-0.5">{isOffline ? "⚠ Offline" : "Schedule Manager"}</p>
            </div>
          </div>
        </div>

        {/* Nav — scrollable with thin scrollbar */}
        <nav className="flex-1 px-3 pb-3 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3a3a4a] px-2 py-1.5">Schedule</p>

          {NAV.filter(n => ["today","timetable","tasks","quizexams","events"].includes(n.id)).map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setSidebarOpen(false); }}
              className={`nav-item ${tab === n.id ? "active" : ""}`}>
              <span className="nav-icon">{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
              {counts[n.id] ? (
                <span className="text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 bg-white/10 text-white/70">
                  {counts[n.id]}
                </span>
              ) : null}
            </button>
          ))}

          <div className="h-px bg-[var(--side-border)] my-2" />
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3a3a4a] px-2 pb-1.5">Tools</p>

          {NAV.filter(n => ["gpa","profile"].includes(n.id)).map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setSidebarOpen(false); }}
              className={`nav-item ${tab === n.id ? "active" : ""}`}>
              <span className="nav-icon">{n.icon}</span>
              <span className="flex-1 text-left">{n.label}</span>
            </button>
          ))}

          {/* Stats pushed to bottom */}
          <div className="mt-auto pt-3">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Lectures", val: lectures.length },
                { label: "Today",    val: todayLectures.length },
                { label: "Pending",  val: items.filter(i=>i.status==="pending").length },
                { label: "Done",     val: items.filter(i=>i.status==="done").length },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <p className="text-white font-bold text-sm leading-none">{s.val}</p>
                  <p className="text-[var(--side-text)] text-[10px] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* User — pinned at bottom, part of sidebar */}
        <div className="shrink-0 border-t border-[var(--side-border)] mx-3 mb-3 pt-3">
          <div
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => { setTab("profile"); setSidebarOpen(false); }}>
            {user.image
              ? <Image src={user.image} alt={user.name ?? "U"} width={30} height={30} className="rounded-full shrink-0 ring-1 ring-white/10" />
              : <div className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-sm shrink-0">{user.name?.charAt(0) ?? "?"}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-tight">{user.name ?? "Student"}</p>
              <p className="text-[var(--side-text)] text-[10px] truncate">{user.email}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); signOut({ callbackUrl: "/auth/signin" }); }}
              className="p-1 text-[var(--side-text)] hover:text-red-400 rounded transition-colors shrink-0"
              title="Sign out">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ─── Main ─── */}
      <div className="lg:ml-60 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-[var(--border)] px-4 lg:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-[var(--tx-1)] text-base">
              {NAV.find(n => n.id === tab)?.label}
            </h1>
          </div>
          {isPending && <div className="w-4 h-4 border-2 border-[var(--tx-1)] border-t-transparent rounded-full animate-spin" />}
          {!isOffline && (
            <div className="flex gap-2">
              <button onClick={() => setLectureModal({ open: true, edit: null })} className="btn btn-secondary text-xs py-1.5 px-3 gap-1 hidden sm:flex">
                📅 Lecture
              </button>
              <button onClick={() => setItemModal({ open: true, edit: null, type: "assignment" })} className="btn btn-primary text-xs py-1.5 px-3 gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-5xl w-full mx-auto space-y-5">

          {/* ── TODAY ── */}
          {tab === "today" && (
            <div className="space-y-5 fade-in">
              <LiveClock />
              <NextClassWidget lectures={lectures} />

              {/* Today's classes */}
              <div>
                <div className="section-header">
                  <h3>Today's Classes</h3>
                  <div className="line" />
                  <span className="text-xs text-[var(--tx-3)]">{todayLectures.length} classes</span>
                </div>
                {todayLectures.length === 0
                  ? <EmptyState icon="📚" title="No classes today" body="Enjoy your free day!" action="+ Add Lecture" onAction={() => setLectureModal({ open:true, edit:null })} />
                  : <div className="space-y-3">{todayLectures.map(l => <LectureCard key={l.id} lecture={l} onEdit={e => setLectureModal({ open:true, edit:e })} />)}</div>
                }
              </div>

              {/* Due today */}
              {todayDueItems.length > 0 && (
                <div>
                  <div className="section-header">
                    <h3>Due Today</h3>
                    <div className="line" />
                  </div>
                  <div className="space-y-3">
                    {todayDueItems.map(i => (
                      <ItemCard key={i.id} item={i} onEdit={e => setItemModal({ open:true, edit:e })} onRefresh={refreshItems} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TIMETABLE ── */}
          {tab === "timetable" && (
            <div className="space-y-4 fade-in">
              <div className="section-header">
                <h3>Weekly Timetable</h3>
                <div className="line" />
                <button onClick={() => setLectureModal({ open:true, edit:null })} className="btn btn-primary text-xs py-1.5 px-3 gap-1 disabled:opacity-40" disabled={isOffline}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Add Lecture
                </button>
              </div>
              <WeeklyGrid
                lectures={lectures}
                onEdit={l => setLectureModal({ open:true, edit:l })}
                onSlotClick={(day, time) => setLectureModal({ open:true, edit:null, day, time })}
              />
              {/* All lectures list */}
              {lectures.length > 0 && (
                <div>
                  <div className="section-header mt-2"><h3>All Lectures</h3><div className="line"/></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DAYS.map((day, i) => {
                      const dl = lectures.filter(l=>l.dayOfWeek===i).sort((a,b)=>a.startTime.localeCompare(b.startTime));
                      if (!dl.length) return null;
                      return (
                        <div key={i}>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${i===todayDay?"text-[var(--accent)]":"text-[var(--tx-3)]"}`}>{day} {i===todayDay && "• Today"}</p>
                          <div className="space-y-2">{dl.map(l=><LectureCard key={l.id} lecture={l} onEdit={e=>setLectureModal({open:true,edit:e})} compact/>)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TASKS ── */}
          {tab === "tasks" && (
            <div className="space-y-5 fade-in">
              <SectionHeader title="Assignments & Tutorials" count={pendingTasks.length}
                onAdd={() => setItemModal({ open:true, edit:null, type:"assignment" })} addLabel="+ New Task" />

              {taskItems.length === 0
                ? <EmptyState icon="📝" title="No tasks yet" body="Add assignments and tutorials to track deadlines." action="+ Add Assignment" onAction={() => setItemModal({open:true,edit:null,type:"assignment"})} />
                : (
                  <div className="space-y-6">
                    {pendingTasks.length > 0 && (
                      <div>
                        <div className="section-header"><h3>Pending</h3><div className="line"/><span className="text-xs text-[var(--tx-3)]">{pendingTasks.length}</span></div>
                        <div className="space-y-3">{pendingTasks.sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999")).map(i=><ItemCard key={i.id} item={i} onEdit={e=>setItemModal({open:true,edit:e})} onRefresh={refreshItems}/>)}</div>
                      </div>
                    )}
                    {doneTasks.length > 0 && (
                      <div>
                        <div className="section-header"><h3>Completed</h3><div className="line"/><span className="text-xs text-[var(--tx-3)]">{doneTasks.length}</span></div>
                        <div className="space-y-3">{doneTasks.map(i=><ItemCard key={i.id} item={i} onEdit={e=>setItemModal({open:true,edit:e})} onRefresh={refreshItems}/>)}</div>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          )}

          {/* ── QUIZZES & EXAMS ── */}
          {tab === "quizexams" && (
            <div className="space-y-5 fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[var(--tx-1)] text-base">Quizzes & Exams</h2>
                {!isOffline && (
                  <div className="flex gap-2">
                    <button onClick={() => setItemModal({open:true,edit:null,type:"quiz"})} className="btn btn-secondary text-xs py-1.5 px-3">⚡ Quiz</button>
                    <button onClick={() => setItemModal({open:true,edit:null,type:"exam"})} className="btn btn-primary text-xs py-1.5 px-3">🎓 Exam</button>
                  </div>
                )}
              </div>
              {quizExamItems.length === 0
                ? <EmptyState icon="🎓" title="No quizzes or exams" body="Track your upcoming quizzes and exams with date and location." />
                : (
                  <div className="space-y-6">
                    {["quiz","exam"].map(type => {
                      const group = quizExamItems.filter(i=>i.type===type);
                      if (!group.length) return null;
                      return (
                        <div key={type}>
                          <div className="section-header">
                            <h3>{type === "quiz" ? "⚡ Quizzes" : "🎓 Exams"}</h3>
                            <div className="line"/>
                          </div>
                          <div className="space-y-3">{group.map(i=><ItemCard key={i.id} item={i} onEdit={e=>setItemModal({open:true,edit:e})} onRefresh={refreshItems}/>)}</div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          )}

          {/* ── EVENTS ── */}
          {tab === "events" && (
            <div className="space-y-5 fade-in">
              <SectionHeader title="Events & Reminders" count={eventItems.filter(i=>i.status==="pending").length}
                onAdd={() => setItemModal({open:true,edit:null,type:"event"})} addLabel="+ New Event" />
              {eventItems.length === 0
                ? <EmptyState icon="🔔" title="No events yet" body="Add reminders for meetings, office hours, deadlines and other events." action="+ Add Event" onAction={() => setItemModal({open:true,edit:null,type:"event"})} />
                : <div className="space-y-3">{eventItems.map(i=><ItemCard key={i.id} item={i} onEdit={e=>setItemModal({open:true,edit:e})} onRefresh={refreshItems}/>)}</div>
              }
            </div>
          )}

          {/* ── GPA ── */}
          {tab === "gpa" && <GpaCalculator />}

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div className="fade-in">
              <h2 className="font-bold text-[var(--tx-1)] text-base mb-5">My Profile</h2>
              <ProfileSettings user={user} />
            </div>
          )}
        </main>
      </div>

      {/* Lecture Modal */}
      <LectureModal
        isOpen={lectureModal.open}
        onClose={async () => { setLectureModal({open:false,edit:null}); await refreshLectures(); }}
        editLecture={lectureModal.edit}
        defaultDay={lectureModal.day}
        defaultStartTime={lectureModal.time}
      />

      {/* Item Modal */}
      <ItemModal
        isOpen={itemModal.open}
        onClose={async () => { setItemModal({open:false,edit:null}); await refreshItems(); }}
        editItem={itemModal.edit}
        defaultType={itemModal.type}
      />
    </div>
  );
}
