"use client";

import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleLoginButtonProps {
  onSuccessRedirect?: () => void;
  text?: string;
}

export default function GoogleLoginButton({
  onSuccessRedirect,
  text = "Continue with Google",
}: GoogleLoginButtonProps) {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const token = tokenResponse.access_token;
        if (!token) {
          toast.error("Google did not return an access token.");
          setLoading(false);
          return;
        }
        const success = await googleLogin(token);
        if (success && onSuccessRedirect) {
          onSuccessRedirect();
        }
      } catch (error) {
        console.error("Google authentication error:", error);
        toast.error("Google authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google OAuth login error:", error);
      if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        toast.error(`Google OAuth origin mismatch for ${window.location.origin}. Please use http://localhost:3000 or add ${window.location.origin} to Google Cloud Console Authorized Origins.`, {
          duration: 8000,
        });
      } else {
        toast.error("Google sign-in was cancelled or failed. Please try again.");
      }
      setLoading(false);
    },
    onNonOAuthError: (error) => {
      console.error("Google non-OAuth error (popup blocked/closed):", error);
      toast.error("Google sign-in popup was blocked or closed. Please try again.");
      setLoading(false);
    },
  });

  return (
    <button
      type="button"
      onClick={() => {
        if (loading) return;
        if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          toast.warning(`Google Login requires http://localhost:3000 or adding ${window.location.origin} to Google Cloud Console Authorized Origins.`, {
            duration: 7000,
          });
        }
        setLoading(true);
        try {
          login();
        } catch (error) {
          console.error("Failed to open Google login:", error);
          toast.error("Failed to open Google sign-in. Please try again.");
          setLoading(false);
        }
        // Reset loading after a timeout in case Google SDK silently fails
        setTimeout(() => {
          setLoading(false);
        }, 10000);
      }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{text}</span>
    </button>
  );
}

