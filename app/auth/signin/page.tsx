// app/auth/signin/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5046e5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (branding) ── */}
      <div className="hidden lg:flex w-[52%] bg-[#0f0f10] flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5046e5] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ScholarSync</span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              Your complete<br />
              <span className="text-[#5046e5]">academic</span><br />
              command centre
            </h1>
            <p className="text-[#71717a] mt-4 text-base leading-relaxed max-w-sm">
              Manage lectures, assignments, quizzes, exams and events — all in one place designed for students who mean business.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              "📅 Weekly timetable",
              "⏰ Deadline reminders",
              "📝 Assignment tracker",
              "🎯 Exam planner",
              "🔔 Event reminders",
            ].map(f => (
              <span key={f} className="text-xs bg-white/8 text-[#a1a1aa] px-3 py-1.5 rounded-full border border-white/10">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-[#3f3f46]">© 2026 ScholarSync</p>
      </div>

      {/* ── Right panel (sign in) ── */}
      <div className="flex-1 flex items-center justify-center bg-[#f4f4f5] p-8">
        <div className="w-full max-w-[380px] fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#5046e5] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-[#09090b] text-base">ScholarSync</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#09090b] tracking-tight">Welcome back</h2>
            <p className="text-[#71717a] text-sm mt-1">Sign in to access your schedule</p>
          </div>

          {/* Sign in card */}
          <div className="bg-white rounded-2xl border border-[#e4e4e7] p-6 shadow-sm">
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#e4e4e7] text-[#09090b] rounded-xl py-3 px-4 font-semibold text-sm hover:bg-[#f4f4f5] hover:border-[#d4d4d8] transition-all duration-150 shadow-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e4e4e7]" /></div>
              <div className="relative flex justify-center"><span className="text-xs text-[#a1a1aa] bg-white px-3">or</span></div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-[#71717a]">New here? Your account is created automatically</p>
              <p className="text-xs text-[#71717a]">when you sign in with Google for the first time.</p>
            </div>
          </div>

          <p className="text-center text-xs text-[#a1a1aa] mt-6">
            By signing in you agree to our data storage policy.
          </p>
        </div>
      </div>
    </div>
  );
}
