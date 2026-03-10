// components/GpaCalculator.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { StudentProfile, useProfile } from "@/components/StudentProfile";

/* ─── Types ─────────────────────────────────────────────────── */
type GradeKey =
  | "A+" | "A" | "A-"
  | "B+" | "B" | "B-"
  | "C+" | "C" | "C-"
  | "D+" | "D"
  | "E";

interface Course {
  id: string;
  code: string;
  name: string;
  year: number;
  credits: number;
  grade: GradeKey | "";
  predicted: boolean;   // not yet officially released
  compulsory: boolean;  // cannot be dropped
  dropped: boolean;     // simulation drop (does NOT affect real GPA)
}

/* ─── UoP Official Grade Scale ───────────────────────────────── */
const GRADE_POINTS: Record<GradeKey, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0,
  "E":  0.0,
};

const GRADE_KEYS = Object.keys(GRADE_POINTS) as GradeKey[];

// Year weights for Honours (4-year): 20 / 20 / 30 / 30
const HONOURS_WEIGHTS: Record<number, number> = { 1: 0.20, 2: 0.20, 3: 0.30, 4: 0.30 };
// Year weights for General (3-year): 20 / 30 / 50
const GENERAL_WEIGHTS: Record<number, number>  = { 1: 0.20, 2: 0.30, 3: 0.50 };

const STORAGE_KEY = "scholarsync_gpa_courses_v2";

/* ─── Classification ─────────────────────────────────────────── */
function classify(gpa: number, aPercent: number, isHonours: boolean) {
  if (gpa >= 3.70 && (!isHonours || aPercent >= 50))
    return { label: "First Class",         short: "1st",   color: "#059669", bg: "#d1fae5" };
  if (gpa >= 3.30)
    return { label: "Second Class Upper",  short: "2U",    color: "#0284c7", bg: "#e0f2fe" };
  if (gpa >= 3.00)
    return { label: "Second Class Lower",  short: "2L",    color: "#d97706", bg: "#fef3c7" };
  if (gpa >= 2.00)
    return { label: "Pass",                short: "Pass",  color: "#6366f1", bg: "#ede9fe" };
  return   { label: "Fail / No Class",     short: "Fail",  color: "#dc2626", bg: "#fee2e2" };
}

/* ─── GPA Math ───────────────────────────────────────────────── */
function weightedGPA(
  courses: Course[],
  weights: Record<number, number>,
  maxYear: number,
): number | null {
  const years = Object.keys(weights).map(Number).filter(y => y <= maxYear);
  let totalW = 0, sum = 0;
  for (const y of years) {
    const yrCourses = courses.filter(c => c.year === y && c.grade);
    if (!yrCourses.length) continue;
    const tc = yrCourses.reduce((s, c) => s + c.credits, 0);
    const tp = yrCourses.reduce((s, c) => s + GRADE_POINTS[c.grade as GradeKey] * c.credits, 0);
    if (tc) { sum += (tp / tc) * weights[y]; totalW += weights[y]; }
  }
  return totalW ? sum / totalW : null;
}

function yearGPA(courses: Course[], year: number): number | null {
  const yr = courses.filter(c => c.year === year && c.grade);
  if (!yr.length) return null;
  const tc = yr.reduce((s, c) => s + c.credits, 0);
  return tc ? yr.reduce((s, c) => s + GRADE_POINTS[c.grade as GradeKey] * c.credits, 0) / tc : null;
}

/* ─── Course Code Parser ─────────────────────────────────────── */
function parseCourseCode(code: string) {
  const m = code.trim().toUpperCase().match(/^[A-Z]+(\d)(\d*)(\d)$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const credits = parseInt(m[3], 10);
  if (year < 1 || year > 4 || credits < 1 || credits > 6) return null;
  return { year, credits };
}

/* ─── Grade colour helper ────────────────────────────────────── */
function gradeColor(g: GradeKey | "") {
  if (!g) return "text-[var(--tx-3)]";
  const p = GRADE_POINTS[g];
  if (p >= 3.7) return "text-emerald-600 font-bold";
  if (p >= 3.0) return "text-blue-600 font-bold";
  if (p >= 2.0) return "text-amber-600 font-bold";
  return "text-red-600 font-bold";
}

/* ─── Component ─────────────────────────────────────────────── */
export function GpaCalculator() {
  const { profile, saveProfile, loaded } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [simMode, setSimMode] = useState(false);
  const [showPrediction, setShowPrediction] = useState(true);

  // Add-course form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<GradeKey | "">("");
  const [predicted, setPredicted] = useState(false);
  const [compulsory, setCompulsory] = useState(false);
  const [manualYear, setManualYear] = useState<number | "">("");
  const [manualCredits, setManualCredits] = useState<number | "">("");
  const [codeError, setCodeError] = useState("");
  const [parseResult, setParseResult] = useState<{ year: number; credits: number } | null>(null);

  // Load courses
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setCourses(JSON.parse(saved)); } catch {} }
  }, []);

  const save = useCallback((updated: Course[]) => {
    setCourses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // Parse code on change
  useEffect(() => {
    const parsed = parseCourseCode(code);
    setParseResult(parsed);
    if (parsed) { setManualYear(""); setManualCredits(""); }
    setCodeError("");
  }, [code]);

  const handleAdd = () => {
    const parsed = parseResult;
    const year = parsed?.year ?? (manualYear !== "" ? Number(manualYear) : null);
    const credits = parsed?.credits ?? (manualCredits !== "" ? Number(manualCredits) : null);
    if (!code.trim())              { setCodeError("Enter a course code"); return; }
    if (!year || year < 1 || year > 4) { setCodeError("Year must be 1–4"); return; }
    if (!credits || credits < 1)   { setCodeError("Enter credits (≥1)"); return; }
    if (!grade)                    { setCodeError("Select a grade"); return; }

    save([...courses, {
      id: Date.now().toString(), code: code.trim().toUpperCase(), name: name.trim(),
      year, credits, grade: grade as GradeKey, predicted, compulsory, dropped: false,
    }]);
    setCode(""); setName(""); setGrade(""); setPredicted(false); setCompulsory(false);
    setManualYear(""); setManualCredits(""); setCodeError("");
  };

  const removeCourse   = (id: string) => save(courses.filter(c => c.id !== id));
  const toggleDropped  = (id: string) => save(courses.map(c => c.id === id && !c.compulsory ? { ...c, dropped: !c.dropped } : c));
  const togglePredicted= (id: string) => save(courses.map(c => c.id === id ? { ...c, predicted: !c.predicted } : c));
  const updateGrade    = (id: string, g: GradeKey | "") => save(courses.map(c => c.id === id ? { ...c, grade: g } : c));
  const resetDrops     = () => save(courses.map(c => ({ ...c, dropped: false })));

  // ── Derived data ──
  const isHonours = profile?.degreeType !== "general";
  const maxYear   = isHonours ? 4 : 3;
  const weights   = isHonours ? HONOURS_WEIGHTS : GENERAL_WEIGHTS;

  // Real GPA = confirmed (not predicted), irrespective of dropped state
  const realCourses = courses.filter(c => !c.predicted && c.grade);
  // Simulation GPA = confirmed + not dropped
  const simCourses  = courses.filter(c => !c.predicted && !c.dropped && c.grade);
  // Predicted GPA = everything (including predicted)
  const predCourses = courses.filter(c => c.grade);

  const realGPA = weightedGPA(realCourses, weights, maxYear);
  const simGPA  = weightedGPA(simCourses,  weights, maxYear);
  const predGPA = weightedGPA(predCourses, weights, maxYear);

  const aPercent = (arr: Course[]) => {
    const g = arr.filter(c => c.grade);
    if (!g.length) return 0;
    return (g.filter(c => c.grade === "A" || c.grade === "A+").length / g.length) * 100;
  };

  const realClass = realGPA !== null ? classify(realGPA, aPercent(realCourses), isHonours) : null;
  const simClass  = simGPA  !== null ? classify(simGPA,  aPercent(simCourses),  isHonours) : null;
  const predClass = predGPA !== null ? classify(predGPA, aPercent(predCourses), isHonours) : null;

  const droppedCount    = courses.filter(c => c.dropped).length;
  const hasPredicted    = courses.some(c => c.predicted);
  const totalRealCreds  = realCourses.reduce((s, c) => s + c.credits, 0);

  // Grouped by year
  const byYear = [1, 2, 3, 4].filter(y => y <= maxYear || courses.some(c => c.year === y))
    .map(y => ({ year: y, courses: courses.filter(c => c.year === y) }))
    .filter(g => g.courses.length);

  if (!loaded) return <div className="p-10 text-center text-[var(--tx-3)] text-sm">Loading…</div>;

  return (
    <div className="space-y-5 fade-in">

      {/* ── Profile ── */}
      <StudentProfile profile={profile} onSave={saveProfile} defaultExpanded={!profile} />

      {/* ── GPA Summary ── */}
      {realGPA !== null && (
        <div className={`grid gap-4 ${hasPredicted && showPrediction ? "sm:grid-cols-2" : ""}`}>

          {/* Official GPA */}
          <div className="surface p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="label">Official GPA</p>
                <p className="font-mono text-5xl font-extrabold text-[var(--tx-1)] leading-none">
                  {realGPA.toFixed(2)}
                </p>
                <p className="text-xs text-[var(--tx-3)] mt-1">
                  {totalRealCreds} confirmed credits · {aPercent(realCourses).toFixed(0)}% A/A+
                </p>
              </div>
              {realClass && (
                <span className="badge text-sm px-3 py-1.5" style={{ background: realClass.bg, color: realClass.color }}>
                  {realClass.label}
                </span>
              )}
            </div>

            {/* Year breakdown */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
              {[1, 2, 3, 4].filter(y => y <= maxYear).map(y => {
                const gpa = yearGPA(realCourses.filter(c => c.year === y), y) ??
                  yearGPA(realCourses, y);
                const g = yearGPA(realCourses.filter(c => c.year === y), y);
                const tc = realCourses.filter(c => c.year === y).reduce((s, c) => s + c.credits, 0);
                return (
                  <div key={y} className="text-center">
                    <p className="text-[10px] font-bold text-[var(--tx-3)] uppercase">Y{y}</p>
                    <p className={`font-mono font-bold text-base mt-0.5 ${g !== null ? "text-[var(--tx-1)]" : "text-[var(--tx-3)]"}`}>
                      {g !== null ? g.toFixed(2) : "—"}
                    </p>
                    {tc > 0 && <p className="text-[9px] text-[var(--tx-3)]">{tc} cr</p>}
                    <p className="text-[9px] text-[var(--accent)]">×{(weights[y] ?? 0) * 100}%</p>
                  </div>
                );
              })}
            </div>

            {/* Classification ladder */}
            <div className="space-y-1.5">
              {[
                { label: "First Class",        min: 3.70, extra: isHonours && aPercent(realCourses) < 50 ? " + 50% A/A+" : "" },
                { label: "Second Class Upper", min: 3.30 },
                { label: "Second Class Lower", min: 3.00 },
                { label: "Pass",               min: 2.00 },
              ].map(r => {
                const met = realGPA >= r.min && !(r.label === "First Class" && isHonours && aPercent(realCourses) < 50);
                return (
                  <div key={r.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${met ? "bg-emerald-50 text-emerald-700" : "bg-[var(--bg)] text-[var(--tx-3)]"}`}>
                    <span className="shrink-0">{met ? "✓" : "○"}</span>
                    <span className="font-semibold">{r.label}</span>
                    <span className="ml-auto opacity-60">≥{r.min.toFixed(2)}{r.extra}</span>
                  </div>
                );
              })}
            </div>

            {/* Simulation toggle */}
            {courses.some(c => !c.compulsory && !c.predicted) && (
              <button
                onClick={() => setSimMode(p => !p)}
                className={`w-full text-xs py-2 rounded-lg border font-semibold transition-all ${
                  simMode
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-white border-[var(--border)] text-[var(--tx-2)] hover:border-[var(--border-2)]"}`}>
                {simMode ? "🧪 Simulation ON · click to exit" : "🧪 Open Drop Simulation"}
              </button>
            )}
          </div>

          {/* Predicted GPA */}
          {hasPredicted && showPrediction && predGPA !== null && (
            <div className="surface p-5 border-violet-200 space-y-4" style={{ borderColor: "#c4b5fd" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="label" style={{ color: "#7c3aed" }}>Predicted GPA</p>
                    <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                      includes unreleased
                    </span>
                  </div>
                  <p className="font-mono text-5xl font-extrabold text-violet-700 leading-none">
                    {predGPA.toFixed(2)}
                  </p>
                  <p className="text-xs text-violet-400 mt-1">
                    {predCourses.reduce((s, c) => s + c.credits, 0)} total credits
                  </p>
                </div>
                {predClass && (
                  <span className="badge text-sm px-3 py-1.5" style={{ background: predClass.bg, color: predClass.color }}>
                    {predClass.label}
                  </span>
                )}
              </div>

              {/* Year breakdown (predicted) */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-violet-50 rounded-xl border border-violet-100">
                {[1, 2, 3, 4].filter(y => y <= maxYear).map(y => {
                  const g = yearGPA(predCourses.filter(c => c.year === y), y);
                  const tc = predCourses.filter(c => c.year === y).reduce((s, c) => s + c.credits, 0);
                  return (
                    <div key={y} className="text-center">
                      <p className="text-[10px] font-bold text-violet-400 uppercase">Y{y}</p>
                      <p className={`font-mono font-bold text-base mt-0.5 ${g !== null ? "text-violet-700" : "text-violet-300"}`}>
                        {g !== null ? g.toFixed(2) : "—"}
                      </p>
                      {tc > 0 && <p className="text-[9px] text-violet-400">{tc} cr</p>}
                      <p className="text-[9px] text-violet-400">×{(weights[y] ?? 0) * 100}%</p>
                    </div>
                  );
                })}
              </div>

              {realGPA !== null && predGPA !== realGPA && (
                <p className={`text-sm font-semibold ${predGPA > realGPA ? "text-emerald-600" : "text-red-500"}`}>
                  {predGPA > realGPA ? "▲" : "▼"} {Math.abs(predGPA - realGPA).toFixed(2)} vs official GPA
                </p>
              )}
              <p className="text-[10px] text-violet-400">🔮 Prediction is separate — it never changes your official GPA.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Drop Simulation Panel ── */}
      {simMode && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🧪</span>
              <div>
                <p className="font-bold text-amber-900 text-sm">Drop Simulation</p>
                <p className="text-xs text-amber-700">
                  Toggle courses to exclude from GPA · Compulsory (🔒) cannot be dropped · Changes are not saved
                </p>
              </div>
            </div>
            {droppedCount > 0 && (
              <button onClick={resetDrops} className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-lg font-semibold transition-all">
                Reset ({droppedCount} dropped)
              </button>
            )}
          </div>

          {simGPA !== null && (
            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-amber-200">
              <div className="text-center">
                <p className="text-[10px] text-[var(--tx-3)] font-semibold uppercase">Official</p>
                <p className="font-mono text-2xl font-bold text-[var(--tx-1)]">{realGPA?.toFixed(2) ?? "—"}</p>
              </div>
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="text-center">
                <p className="text-[10px] text-amber-600 font-semibold uppercase">Simulated</p>
                <p className={`font-mono text-2xl font-bold ${simGPA > (realGPA ?? 0) ? "text-emerald-600" : simGPA < (realGPA ?? 0) ? "text-red-600" : "text-[var(--tx-1)]"}`}>
                  {simGPA.toFixed(2)}
                </p>
              </div>
              <div className="ml-auto text-right">
                {simClass && (
                  <span className="badge" style={{ background: simClass.bg, color: simClass.color }}>
                    {simClass.label}
                  </span>
                )}
                <p className={`text-xs font-semibold mt-1 ${
                  simGPA > (realGPA ?? 0) ? "text-emerald-600"
                  : simGPA < (realGPA ?? 0) ? "text-red-500"
                  : "text-[var(--tx-3)]"}`}>
                  {simGPA === realGPA ? "No change"
                    : `${simGPA > (realGPA ?? 0) ? "+" : ""}${(simGPA - (realGPA ?? 0)).toFixed(2)} GPA`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Course Form ── */}
      <div className="surface p-5">
        <h3 className="font-bold text-[var(--tx-1)] text-sm mb-4">Add Course</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Code */}
          <div>
            <label className="label">Course Code *</label>
            <input className="field" placeholder="e.g. CSC4093"
              value={code} onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()} />
            {parseResult && (
              <p className="text-xs text-emerald-600 mt-1">
                ✓ Year <strong>{parseResult.year}</strong> · <strong>{parseResult.credits}</strong> credits detected
              </p>
            )}
            {code && !parseResult && (
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <label className="label" style={{ marginBottom: 4 }}>Year</label>
                  <select className="field" value={manualYear} onChange={e => setManualYear(Number(e.target.value))}>
                    <option value="">Year</option>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" style={{ marginBottom: 4 }}>Credits</label>
                  <input type="number" className="field" min={1} max={6} placeholder="e.g. 3"
                    value={manualCredits} onChange={e => setManualCredits(Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="label">Course Name <span className="normal-case font-normal text-[var(--tx-3)]">(optional)</span></label>
            <input className="field" placeholder="e.g. Software Engineering"
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()} />
          </div>

          {/* Grade */}
          <div className="sm:col-span-2">
            <label className="label">Grade *</label>
            <div className="flex flex-wrap gap-1.5">
              {GRADE_KEYS.map(g => {
                const p = GRADE_POINTS[g];
                const active = grade === g;
                const bg = active ? (p >= 3.7 ? "#059669" : p >= 3.0 ? "#2563eb" : p >= 2.0 ? "#d97706" : "#dc2626") : undefined;
                return (
                  <button key={g} type="button" onClick={() => setGrade(g === grade ? "" : g)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      active ? "text-white border-transparent" : "border-[var(--border)] text-[var(--tx-2)] hover:border-[var(--border-2)] bg-white"}`}
                    style={bg ? { background: bg } : {}}>
                    {g}
                    {active && <span className="ml-1 opacity-80">({p.toFixed(1)})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flags */}
          <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
            {/* Predicted */}
            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${predicted ? "border-violet-300 bg-violet-50" : "border-[var(--border)] bg-[var(--bg)]"}`}>
              <div onClick={() => setPredicted(p => !p)}
                className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${predicted ? "bg-violet-500" : "bg-[var(--border-2)]"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${predicted ? "left-4" : "left-0.5"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--tx-1)]">🔮 Predicted result</p>
                <p className="text-xs text-[var(--tx-3)]">Won't affect official GPA</p>
              </div>
            </label>

            {/* Compulsory */}
            <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${compulsory ? "border-red-300 bg-red-50" : "border-[var(--border)] bg-[var(--bg)]"}`}>
              <div onClick={() => setCompulsory(p => !p)}
                className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${compulsory ? "bg-red-500" : "bg-[var(--border-2)]"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${compulsory ? "left-4" : "left-0.5"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--tx-1)]">🔒 Compulsory</p>
                <p className="text-xs text-[var(--tx-3)]">Cannot be dropped in simulation</p>
              </div>
            </label>
          </div>
        </div>

        {codeError && <p className="text-red-600 text-xs mt-2">⚠ {codeError}</p>}

        <button onClick={handleAdd} className="btn btn-primary mt-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Course
        </button>
      </div>

      {/* ── Grade Scale Reference ── */}
      <div className="surface p-4">
        <p className="label mb-3">UoP Official Grade Scale</p>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {GRADE_KEYS.map(g => (
            <div key={g} className="text-center p-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
              <p className={`font-bold text-xs ${gradeColor(g)}`}>{g}</p>
              <p className="font-mono text-[10px] text-[var(--tx-3)]">{GRADE_POINTS[g].toFixed(1)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].filter(y => y <= maxYear).map(y => (
            <div key={y} className="text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2">
              <span className="font-bold">Year {y}</span>
              <span className="float-right text-[var(--accent)] font-bold">{(weights[y] ?? 0) * 100}%</span>
              <p className="text-[var(--tx-3)] text-[10px] mt-0.5">of final GPA</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Course Table ── */}
      {courses.length > 0 && (
        <div className="surface overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--tx-1)] text-sm">All Courses ({courses.length})</h3>
              {hasPredicted && (
                <button onClick={() => setShowPrediction(p => !p)}
                  className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition-all ${showPrediction ? "bg-violet-100 border-violet-300 text-violet-700" : "border-[var(--border)] text-[var(--tx-3)]"}`}>
                  🔮 {showPrediction ? "Hide" : "Show"} prediction
                </button>
              )}
            </div>
            <button onClick={() => { if (confirm("Remove all courses?")) save([]); }}
              className="text-xs text-red-500 hover:text-red-700">Clear all</button>
          </div>

          {byYear.map(({ year, courses: yrCourses }) => {
            const yrReal = yrCourses.filter(c => !c.predicted && c.grade);
            const yrGPA  = yearGPA(yrReal, year);
            const yrCreds = yrReal.reduce((s, c) => s + c.credits, 0);
            const yrSimGPA = simMode ? yearGPA(yrReal.filter(c => !c.dropped), year) : null;

            return (
              <div key={year}>
                {/* Year header */}
                <div className="px-5 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[var(--tx-1)]">
                      Year {year}
                      {year === profile?.currentYear && (
                        <span className="ml-2 text-[10px] bg-[var(--accent-light)] text-[var(--accent)] px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--tx-3)]">
                      {(weights[year] ?? 0) * 100}% weight · {yrCreds} credits
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {simMode && yrSimGPA !== null && yrSimGPA !== yrGPA && (
                      <span className={`font-mono text-xs ${yrSimGPA > (yrGPA ?? 0) ? "text-emerald-600" : "text-red-500"}`}>
                        sim: {yrSimGPA.toFixed(2)}
                      </span>
                    )}
                    {yrGPA !== null && (
                      <span className="font-mono text-sm font-bold text-[var(--tx-1)]">
                        GPA {yrGPA.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Course rows */}
                <div className="divide-y divide-[var(--border)]">
                  {yrCourses.map(c => {
                    const isDropped = c.dropped;
                    const canDrop   = !c.compulsory && !c.predicted;
                    return (
                      <div key={c.id}
                        className={`px-5 py-3 flex items-center gap-3 group transition-all
                          ${c.predicted ? "bg-violet-50/40" : ""}
                          ${isDropped ? "opacity-50 bg-amber-50/50" : ""}`}>

                        {/* Drop toggle (sim mode) or status icon */}
                        {simMode && canDrop ? (
                          <button onClick={() => toggleDropped(c.id)} title={isDropped ? "Restore" : "Drop"}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDropped ? "border-amber-400 bg-amber-100" : "border-[var(--border-2)] hover:border-amber-400"}`}>
                            {isDropped && <span className="text-amber-600 text-xs font-bold">×</span>}
                          </button>
                        ) : simMode && c.compulsory ? (
                          <span className="text-base shrink-0" title="Compulsory — cannot be dropped">🔒</span>
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-mono text-sm font-bold ${isDropped ? "line-through text-[var(--tx-3)]" : "text-[var(--tx-1)]"}`}>
                              {c.code}
                            </span>
                            {c.name && <span className="text-xs text-[var(--tx-3)] truncate max-w-[120px]">{c.name}</span>}
                            {c.compulsory && !simMode && <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">🔒 Compulsory</span>}
                            {c.predicted && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-semibold">🔮 Predicted</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-[var(--tx-3)]">{c.credits} cr</span>
                            {c.grade && (
                              <span className={`text-[10px] font-mono ${gradeColor(c.grade)}`}>
                                {GRADE_POINTS[c.grade as GradeKey].toFixed(1)} pts
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grade selector */}
                        <select value={c.grade}
                          onChange={e => updateGrade(c.id, e.target.value as GradeKey | "")}
                          className={`font-mono text-sm border rounded-lg px-2 py-1 bg-white outline-none transition-all shrink-0 ${gradeColor(c.grade)} border-[var(--border)] hover:border-[var(--border-2)]`}>
                          <option value="">— Grade</option>
                          {GRADE_KEYS.map(g => (
                            <option key={g} value={g}>{g} ({GRADE_POINTS[g].toFixed(1)})</option>
                          ))}
                        </select>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => togglePredicted(c.id)} className="btn-icon text-[10px] shrink-0"
                            title={c.predicted ? "Mark official" : "Mark as predicted"}>
                            {c.predicted ? "✓" : "🔮"}
                          </button>
                          <button onClick={() => removeCourse(c.id)}
                            className="btn-icon hover:!text-red-600 hover:!bg-red-50 shrink-0" title="Delete">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {courses.length === 0 && (
        <div className="surface p-12 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="font-bold text-[var(--tx-1)]">No courses yet</p>
          <p className="text-[var(--tx-3)] text-sm mt-1">
            Add course codes above — try <strong>CSC4093</strong> to see auto-detection
          </p>
        </div>
      )}
    </div>
  );
}
