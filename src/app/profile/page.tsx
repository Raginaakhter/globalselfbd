"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User as UserIcon, ArrowLeft, Mail, Calendar, LogOut, Pencil, Loader2, Save, X } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, updateProfile, authenticatedFetch, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  // Load the latest profile from the backend
  useEffect(() => {
    if (!user) return;
    authenticatedFetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setName(data.data.profile.name ?? "");
          setAvatar(data.data.profile.avatar ?? "");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startEditing = () => {
    setName(user?.name ?? "");
    setAvatar(user?.avatar ?? "");
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile(name, avatar);
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      {/* Navbar */}
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <Link href="/" className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Global Shelf <span className="text-cyan-600">BD</span>
            </span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Profile Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[3px] shadow-xl shadow-cyan-500/20 mb-4">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl font-black text-cyan-600 overflow-hidden">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : "U"
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>

        {/* Profile Card */}
        <div className="auth-card rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-cyan-600" />
              <span>Personal & Security Information</span>
            </h2>
            {!editing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="avatar" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  id="avatar"
                  type="url"
                  placeholder="https://..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{user?.email} (cannot be changed)</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{user?.email}</span>
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Authentication Method</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                  {user?.provider || "local"} Account
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Member Since</span>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
