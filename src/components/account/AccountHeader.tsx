"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, LogOut } from "lucide-react";

/** Shared top bar for account-area pages (profile, order detail, admin) so they stay visually
 *  consistent without each page re-implementing the same header. */
export default function AccountHeader({ title }: { title?: string }) {
  const { logout } = useAuth();

  return (
    <header className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Store</span>
        </Link>

        <Link href="/" className="flex items-center gap-3">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
            Global Shelf <span className="text-cyan-600">BD</span>
          </span>
          {title && <span className="hidden sm:inline text-sm text-slate-400 font-semibold">· {title}</span>}
        </Link>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
