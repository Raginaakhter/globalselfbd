"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Globe, LogIn, UserPlus, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between relative z-20">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
            <Globe className="w-6 h-6 text-cyan-600" />
          </div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            Global Shelf <span className="text-cyan-600">BD</span>
          </span>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Next-Gen E-Commerce Platform
          </p>
        </div>
      </Link>

      {/* Auth Actions */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white btn-primary-gradient"
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile ({user?.name?.split(" ")[0] || "User"})</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
            >
              <LogIn className="w-4 h-4 text-cyan-600" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white btn-primary-gradient"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
