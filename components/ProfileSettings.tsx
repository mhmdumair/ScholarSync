// components/ProfileSettings.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { updateProfile } from "@/app/actions/profile";
import toast from "react-hot-toast";
import { StudentProfile, useProfile } from "@/components/StudentProfile";

interface Props {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export function ProfileSettings({ user }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { profile, saveProfile } = useProfile();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      await updateProfile({ name });
      toast.success("Profile updated!");
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto">
      
      {/* Avatar & Header Card */}
      <div className="surface p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Profile"}
              width={96}
              height={96}
              className="rounded-2xl shrink-0 border border-white/60 shadow-[0_8px_20px_rgb(0,0,0,0.08)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-slate-700 flex items-center justify-center text-white text-3xl font-extrabold shrink-0 shadow-[0_8px_20px_rgb(0,0,0,0.12)]">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-[3px] border-white shadow-sm" title="Online" />
        </div>
        
        <div className="flex-1 text-center sm:text-left z-10">
          <h2 className="outfit font-bold text-[var(--tx-1)] text-2xl tracking-tight">{user.name ?? "No name set"}</h2>
          <p className="text-[15px] font-medium text-[var(--tx-3)] mt-1">{user.email}</p>
          
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-[var(--border)] shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-xs font-semibold text-[var(--tx-2)]">Google Account</span>
          </div>
        </div>
      </div>

      {/* Academic Profile */}
      <h3 className="outfit font-bold text-[var(--tx-1)] text-lg px-2 mt-8 -mb-2">Academic Profile</h3>
      <div className="-mx-2 sm:mx-0">
        <StudentProfile profile={profile} onSave={saveProfile} defaultExpanded={!profile} />
      </div>

      <div className="h-4" />

      {/* Edit Form Card */}
      <div className="surface p-8 delay-100">
        <div className="mb-6">
          <h3 className="outfit font-bold text-[var(--tx-1)] text-lg">Account Details</h3>
          <p className="text-sm text-[var(--tx-3)] mt-1">Manage your public display information</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label text-xs">Display Name</label>
              <input
                className="field text-base py-2.5 px-4 bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                value={name}
                onChange={e => { setName(e.target.value); setDirty(true); }}
                placeholder="What should we call you?"
                maxLength={80}
              />
              {dirty && name !== user.name && (
                <p className="text-[11.5px] font-medium text-amber-600 mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </p>
              )}
            </div>

            <div>
              <label className="label text-xs">Email Address</label>
              <div className="field py-2.5 px-4 bg-gray-100/80 text-[var(--tx-3)] cursor-not-allowed select-all border-dashed" style={{ userSelect: "all" }}>
                {user.email}
              </div>
              <p className="text-[11px] text-[var(--tx-3)] mt-1.5">Managed by Google</p>
            </div>

            <div>
              <label className="label text-xs">Account ID</label>
              <div className="field py-2.5 px-4 bg-gray-100/80 text-[var(--tx-3)] font-mono text-xs cursor-not-allowed border-dashed truncate">
                {user.id}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={saving || !dirty || !name.trim()}
              className="btn btn-primary px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving updates…
                </span>
              ) : "Save Changes"}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() => { setName(user.name ?? ""); setDirty(false); }}
                className="btn btn-secondary px-5 py-2.5"
              >
                Discard
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="surface p-8 border border-red-100 bg-red-50/30 delay-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="outfit font-bold text-red-900 text-base">Sign Out of ScholarSync</h3>
            <p className="text-[13px] text-red-700/80 mt-1">
              You will need to sign back in with your Google account.
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="btn bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out Securely
          </button>
        </div>
      </div>
    </div>
  );
}
