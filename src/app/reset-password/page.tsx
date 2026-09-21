"use client";

import React, { useState, useSyncExternalStore, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, Eye, EyeOff, Loader2, Globe, ShieldCheck, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const { resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // The token arrives via the URL or, after the OTP step, via sessionStorage (unavailable during SSR).
  const storedToken = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem("resetToken"),
    () => null
  );
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const resetToken = tokenParam || storedToken || "";
  const missingToken = hydrated && !resetToken;

  // Password strength calculation (0 to 4)
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!resetToken) {
      setErrorMsg("Missing reset token authorization. Please start from Forgot Password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New Password and Confirm Password do not match.");
      return;
    }

    if (strength < 4) {
      setErrorMsg(
        "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character (@$!%*?&)."
      );
      return;
    }

    setLoading(true);
    const success = await resetPassword(resetToken, newPassword, confirmPassword);
    setLoading(false);

    if (success) {
      sessionStorage.removeItem("resetToken");
      router.push("/login");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-white rounded-[15px] flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Global Shelf <span className="text-cyan-600">BD</span>
          </span>
        </Link>
        <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-cyan-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
        <p className="text-sm text-slate-500 mt-1">Create a strong password to secure your account</p>
      </div>

      {/* Main Card */}
      <div className="auth-card auth-card-hover rounded-3xl p-8 shadow-xl">
        {(errorMsg || missingToken) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMsg || "Password reset authorization missing. Please start from Forgot Password."}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength */}
            {newPassword.length > 0 && (
              <div className="mt-2.5">
                <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength >= 1 ? "bg-rose-500 w-1/4" : ""}`}></div>
                  <div className={`h-full transition-all duration-300 ${strength >= 2 ? "bg-amber-500 w-1/4" : ""}`}></div>
                  <div className={`h-full transition-all duration-300 ${strength >= 3 ? "bg-blue-500 w-1/4" : ""}`}></div>
                  <div className={`h-full transition-all duration-300 ${strength >= 4 ? "bg-emerald-500 w-1/4" : ""}`}></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>Strength:</span>
                  <span className="font-semibold text-slate-700">
                    {strength <= 1 && "Weak"}
                    {strength === 2 && "Fair"}
                    {strength === 3 && "Good"}
                    {strength === 4 && "Strong"}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {newPassword === confirmPassword ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                  </span>
                ) : (
                  <span className="text-rose-500 font-medium">Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !resetToken}
            className="w-full py-3.5 px-4 mt-2 rounded-xl font-bold text-sm btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Request a new verification code
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col justify-center items-center p-4 sm:p-8">
      <Suspense fallback={<div className="text-slate-500 font-semibold">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
