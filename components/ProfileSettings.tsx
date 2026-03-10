// components/ProfileSettings.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { updateProfile } from "@/app/actions/profile";
import toast from "react-hot-toast";

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
    <div className="space-y-5 fade-in max-w-xl">

      {/* Avatar card */}
      <div className="surface p-6 flex items-center gap-5">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Profile"}
            width={72}
            height={72}
            className="rounded-2xl shrink-0 border-2 border-[var(--border)]"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
            {initials}
          </div>
        )}
        <div>
          <h2 className="font-bold text-[var(--tx-1)] text-lg">{user.name ?? "No name set"}</h2>
          <p className="text-sm text-[var(--tx-3)] mt-0.5">{user.email}</p>
          <p className="text-xs text-[var(--tx-3)] mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Signed in with Google
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="surface p-6 space-y-5">
        <div>
          <h3 className="font-bold text-[var(--tx-1)] text-sm">Account Details</h3>
          <p className="text-xs text-[var(--tx-3)] mt-0.5">Your display name can be customised here</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display name */}
          <div>
            <label className="label">Display Name</label>
            <input
              className="field"
              value={name}
              onChange={e => { setName(e.target.value); setDirty(true); }}
              placeholder="Your full name"
              maxLength={80}
            />
            {dirty && name !== user.name && (
              <p className="text-xs text-amber-600 mt-1">⚠ Unsaved changes</p>
            )}
          </div>

          {/* Email (read-only, from Google) */}
          <div>
            <label className="label">Email Address</label>
            <div className="field bg-[var(--surface-2)] text-[var(--tx-2)] cursor-not-allowed select-all" style={{ userSelect: "all" }}>
              {user.email}
            </div>
            <p className="text-[10px] text-[var(--tx-3)] mt-1">Email is managed by Google and cannot be changed here</p>
          </div>

          {/* User ID */}
          <div>
            <label className="label">Account ID</label>
            <div className="field bg-[var(--surface-2)] text-[var(--tx-3)] font-mono text-xs cursor-not-allowed">
              {user.id}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !dirty || !name.trim()}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Save Changes"}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() => { setName(user.name ?? ""); setDirty(false); }}
                className="btn btn-secondary"
              >
                Discard
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="surface p-6 border border-red-200">
        <h3 className="font-bold text-[var(--tx-1)] text-sm mb-1">Sign Out</h3>
        <p className="text-xs text-[var(--tx-3)] mb-4">
          You'll be redirected to the sign-in page. Your data is saved.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="btn text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-400 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
