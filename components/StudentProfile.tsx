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
      <div className="surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[var(--tx-1)] text-sm">
              {profile ? "Edit Profile" : "Set Up Your Profile"}
            </h3>
            {!profile && <p className="text-xs text-[var(--tx-3)] mt-0.5">One-time setup for accurate GPA calculation</p>}
          </div>
          {profile && (
            <button onClick={() => { setForm(profile); setEditing(false); }} className="btn-icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Name & Reg */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="field" placeholder="e.g. Kamal Perera" value={form.name}
                onChange={e => setF("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Registration Number</label>
              <input className="field" placeholder="e.g. E/18/365" value={form.regNumber}
                onChange={e => setF("regNumber", e.target.value)} />
            </div>
          </div>

          {/* Year & Degree */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Current Year</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(y => (
                  <button key={y} type="button" onClick={() => setF("currentYear", y)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      form.currentYear === y
                        ? "bg-[var(--accent)] text-white border-transparent"
                        : "border-[var(--border)] text-[var(--tx-2)] hover:border-[var(--border-2)] bg-white"}`}>
                    Y{y}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Degree Programme</label>
              <div className="flex gap-1.5">
                {([["general", "BSc General"], ["honours", "BSc Hons"]] as const).map(([t, l]) => (
                  <button key={t} type="button"
                    onClick={() => setForm(p => ({ ...p, degreeType: t, subjects: [], specialization: "" }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      form.degreeType === t
                        ? "bg-[var(--accent)] text-white border-transparent"
                        : "border-[var(--border)] text-[var(--tx-2)] hover:border-[var(--border-2)] bg-white"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* General → up to 3 subjects */}
          {form.degreeType === "general" && (
            <div>
              <label className="label">
                Subject Areas
                <span className="normal-case font-normal text-[var(--tx-3)] ml-1">
                  ({form.subjects.length}/3 selected)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {SCIENCE_SUBJECTS.map(s => {
                  const selected = form.subjects.includes(s);
                  const maxed = !selected && form.subjects.length >= 3;
                  return (
                    <button key={s} type="button" onClick={() => !maxed && toggleSubject(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        selected ? "bg-[var(--accent)] text-white border-transparent"
                        : maxed ? "border-[var(--border)] text-[var(--tx-3)] opacity-40 cursor-not-allowed"
                        : "border-[var(--border)] text-[var(--tx-2)] hover:border-[var(--accent)] bg-white"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Honours → 1 specialization */}
          {form.degreeType === "honours" && (
            <div>
              <label className="label">Specialization</label>
              <select className="field" value={form.specialization}
                onChange={e => setF("specialization", e.target.value)}>
                <option value="">Select your specialization…</option>
                {HONOURS_SPECS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <button onClick={handleSave} disabled={!form.name.trim()}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            Save Profile
          </button>
        </div>
      </div>
    );
  }

  // Collapsed card
  return (
    <div className="surface p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-extrabold text-lg shrink-0">
        {form.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[var(--tx-1)] text-sm truncate">{form.name}</p>
        <p className="text-xs text-[var(--tx-3)] truncate">
          {form.regNumber && <>{form.regNumber} · </>}
          Year {form.currentYear} ·{" "}
          {form.degreeType === "honours" ? "BSc Hons" : "BSc General"}
          {form.degreeType === "honours" && form.specialization && ` · ${form.specialization}`}
          {form.degreeType === "general" && form.subjects.length > 0 && ` · ${form.subjects.join(", ")}`}
        </p>
      </div>
      <button onClick={() => setEditing(true)} className="btn-icon shrink-0" title="Edit profile">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  );
}
