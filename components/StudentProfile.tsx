// components/StudentProfile.tsx
"use client";

import { useState, useEffect } from "react";

export interface Profile {
  name: string;
  regNumber: string;
  currentYear: number;
  degreeType: "general" | "honours";
  subjects: string[];     // General: up to 3
  specialization: string; // Honours: 1
}

export const SCIENCE_SUBJECTS = [
  "Botany", "Chemistry", "Computer Science", "Data Science",
  "Environmental Science", "Geology", "Mathematics", "Microbiology",
  "Molecular Biology", "Physics", "Statistics", "Zoology",
];

export const HONOURS_SPECS = [
  "Applied Sciences", "Biomedical Science", "Botany", "Chemistry",
  "Computer Science", "Data Science", "Environmental Science", "Geology",
  "Mathematics", "Microbiology", "Molecular Biology & Biotechnology",
  "Physics", "Statistics & Operations Research", "Zoology",
];

const PROFILE_KEY = "scholarsync_profile";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch {}
    }
    setLoaded(true);
  }, []);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  };

  return { profile, saveProfile, loaded };
}

interface Props {
  profile: Profile | null;
  onSave: (p: Profile) => void;
  defaultExpanded?: boolean;
}

const emptyProfile = (): Profile => ({
  name: "", regNumber: "", currentYear: 1,
  degreeType: "honours", subjects: [], specialization: "",
});

export function StudentProfile({ profile, onSave, defaultExpanded = false }: Props) {
  const [editing, setEditing] = useState(defaultExpanded || !profile);
  const [form, setForm] = useState<Profile>(profile ?? emptyProfile());

  useEffect(() => {
    if (profile) { setForm(profile); setEditing(false); }
    else setEditing(true);
  }, [profile]);

  const setF = (k: keyof Profile, v: any) => setForm(p => ({ ...p, [k]: v }));

  const toggleSubject = (s: string) => {
    setForm(p => ({
      ...p,
      subjects: p.subjects.includes(s)
        ? p.subjects.filter(x => x !== s)
        : p.subjects.length < 3 ? [...p.subjects, s] : p.subjects,
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    setEditing(false);
  };

  if (!profile || editing) {
    return (
      <div className="surface p-8 delay-100 max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="outfit font-bold text-[var(--tx-1)] text-2xl tracking-tight">
              {profile ? "Edit Academic Profile" : "Set Up Your Profile"}
            </h3>
            {!profile && <p className="text-sm font-medium text-[var(--tx-3)] mt-1.5">One-time setup for accurate GPA calculation and personalized dashboard</p>}
          </div>
          {profile && (
            <button onClick={() => { setForm(profile); setEditing(false); }} className="btn-icon bg-gray-50 hover:bg-gray-100 shadow-sm">
              <svg className="w-5 h-5 text-[var(--tx-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Name & Reg */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label text-xs">Full Name *</label>
              <input className="field text-base py-2.5 px-4 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" placeholder="e.g. Kamal Perera" value={form.name}
                onChange={e => setF("name", e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Registration Number</label>
              <input className="field text-base py-2.5 px-4 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors uppercase" placeholder="e.g. E/18/365" value={form.regNumber}
                onChange={e => setF("regNumber", e.target.value.toUpperCase())} />
            </div>
          </div>

          {/* Year & Degree */}
          <div className="grid sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="label text-xs">Current Year</label>
              <div className="flex gap-2 p-1 bg-gray-100/50 rounded-xl border border-[var(--border)]">
                {[1, 2, 3, 4].map(y => (
                  <button key={y} type="button" onClick={() => setF("currentYear", y)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      form.currentYear === y
                        ? "bg-white text-[var(--accent)] shadow-sm"
                        : "text-[var(--tx-3)] hover:text-[var(--tx-2)] hover:bg-black/5"}`}>
                    Y{y}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label text-xs">Degree Programme</label>
              <div className="flex gap-2 p-1 bg-gray-100/50 rounded-xl border border-[var(--border)]">
                {([["general", "BSc General"], ["honours", "BSc Hons"]] as const).map(([t, l]) => (
                  <button key={t} type="button"
                    onClick={() => setForm(p => ({ ...p, degreeType: t, subjects: [], specialization: "" }))}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      form.degreeType === t
                        ? "bg-white text-[var(--accent)] shadow-sm"
                        : "text-[var(--tx-3)] hover:text-[var(--tx-2)] hover:bg-black/5"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* General → up to 3 subjects */}
          {form.degreeType === "general" && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="label text-xs flex justify-between">
                <span>Subject Areas</span>
                <span className={`font-semibold ${form.subjects.length === 3 ? "text-emerald-500" : "text-[var(--tx-3)]"}`}>
                  {form.subjects.length}/3 selected
                </span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SCIENCE_SUBJECTS.map(s => {
                  const selected = form.subjects.includes(s);
                  const maxed = !selected && form.subjects.length >= 3;
                  return (
                    <button key={s} type="button" onClick={() => !maxed && toggleSubject(s)}
                      className={`text-[13px] px-3.5 py-1.5 rounded-full border border-[var(--border)] font-semibold transition-all duration-300 ${
                        selected ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-[0_2px_8px_rgba(59,130,246,0.25)]"
                        : maxed ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                        : "bg-white text-[var(--tx-2)] hover:border-indigo-300 hover:text-indigo-600 shadow-sm hover:shadow"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Honours → 1 specialization */}
          {form.degreeType === "honours" && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="label text-xs">Specialization</label>
              <select className="field text-base py-3 px-4 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors" value={form.specialization}
                onChange={e => setF("specialization", e.target.value)}>
                <option value="">Select your specialization…</option>
                {HONOURS_SPECS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="pt-6 border-t border-[var(--border)] mt-6">
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="btn btn-primary w-full py-3.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed">
              Save Profile Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed card
  return (
    <div className="surface p-6 flex flex-col sm:flex-row sm:items-center gap-5 relative overflow-hidden group max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600" />
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-[0_4px_12px_rgba(79,70,229,0.3)] ring-4 ring-indigo-50">
        {form.name.charAt(0).toUpperCase()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="outfit font-bold text-[var(--tx-1)] text-lg truncate tracking-tight">{form.name}</h3>
          {form.regNumber && (
            <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-bold text-[var(--tx-2)] uppercase tracking-wider">
              {form.regNumber}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
          <span className="text-[13px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">
            Year {form.currentYear}
          </span>
          <span className="text-[13px] font-medium text-[var(--tx-3)]">•</span>
          <span className="text-[13px] font-medium text-[var(--tx-2)]">
            {form.degreeType === "honours" ? "BSc Honours" : "BSc General degree"}
          </span>
        </div>

        {(form.specialization || form.subjects.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.degreeType === "honours" && form.specialization && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200/50">
                {form.specialization}
              </span>
            )}
            {form.degreeType === "general" && form.subjects.map(s => (
              <span key={s} className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200/50">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setEditing(true)} 
        className="self-start sm:self-center btn-icon bg-white border border-[var(--border)] shadow-sm hover:border-indigo-200 hover:text-indigo-600 shrink-0 w-10 h-10 rounded-xl" 
        title="Edit profile">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}
