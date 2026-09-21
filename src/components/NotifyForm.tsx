"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    // Simulate API request delay
    setTimeout(() => {
      setStatus("success");
      setMessage("You're on the list! We'll notify you as soon as Global Shelf BD launches.");
      setEmail("");
    }, 1200);
  };

  return (
    <div className="w-full max-w-lg mx-auto my-6">
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-slate-700/60 shadow-xl">
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3 text-cyan-400 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Get Early VIP Access</span>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          Be the first to explore Bangladesh&apos;s most innovative global shelf platform. Subscribe to receive launch notifications and exclusive early-bird offers.
        </p>

        {status === "success" ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="Enter your email address..."
                disabled={status === "loading"}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <span>Notify Me</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 mt-3 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
