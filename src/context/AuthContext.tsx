"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  provider: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<string | null>;
  resetPassword: (resetToken: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  refreshAuthSession: () => Promise<boolean>;
  updateProfile: (name: string, avatar: string) => Promise<boolean>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ref to track the latest access token (avoids stale closures in authenticatedFetch)
  const accessTokenRef = useRef<string | null>(null);

  // Guard ref to prevent concurrent refresh calls (React StrictMode double-mount)
  const refreshInProgressRef = useRef<Promise<boolean> | null>(null);

  // Keep accessTokenRef in sync with state
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Silent session refresh from HttpOnly refresh cookie
  const refreshAuthSession = useCallback(async (): Promise<boolean> => {
    // If a refresh is already in progress, return the existing promise
    if (refreshInProgressRef.current) {
      return refreshInProgressRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          setUser(null);
          setAccessToken(null);
          accessTokenRef.current = null;
          return false;
        }

        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data.user);
          setAccessToken(data.data.accessToken);
          accessTokenRef.current = data.data.accessToken;
          return true;
        } else {
          setUser(null);
          setAccessToken(null);
          accessTokenRef.current = null;
          return false;
        }
      } catch {
        setUser(null);
        setAccessToken(null);
        accessTokenRef.current = null;
        return false;
      } finally {
        refreshInProgressRef.current = null;
      }
    })();

    refreshInProgressRef.current = refreshPromise;
    return refreshPromise;
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      await refreshAuthSession();
      setLoading(false);
    }
    initAuth();
  }, [refreshAuthSession]);

  // Authenticated fetch wrapper with automatic token refresh on 401
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let currentToken = accessTokenRef.current;

      if (!currentToken) {
        const refreshed = await refreshAuthSession();
        if (!refreshed) {
          throw new Error("Unauthorized: Active session expired");
        }
        currentToken = accessTokenRef.current;
      }

      const headers = new Headers(options.headers || {});
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      let response = await fetch(url, { ...options, headers });

      // If token expired during request, attempt silent refresh once
      if (response.status === 401) {
        const refreshed = await refreshAuthSession();
        if (refreshed && accessTokenRef.current) {
          headers.set("Authorization", `Bearer ${accessTokenRef.current}`);
          response = await fetch(url, { ...options, headers });
        }
      }

      return response;
    },
    [refreshAuthSession]
  );

  // Login handler
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        toast.success(data.message || "Welcome back! Login successful.");
        return true;
      } else {
        toast.error(data.message || "Invalid email or password.");
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error. Please check your connection.");
      return false;
    }
  };

  // Register handler
  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        toast.success(data.message || "Account created successfully!");
        return true;
      } else {
        toast.error(data.message || "Registration failed.");
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error. Please check your connection.");
      return false;
    }
  };

  // Google OAuth Login handler
  const googleLogin = async (idToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        toast.success(data.message || "Google authentication successful!");
        return true;
      } else {
        toast.error(data.message || "Google login failed.");
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Google authentication failed due to network error.");
      return false;
    }
  };

  // Forgot Password handler
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Please check your email for the verification code.");
        return true;
      } else {
        toast.error(data.message || "Failed to process forgot password request.");
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error. Please try again.");
      return false;
    }
  };

  // Verify OTP handler
  const verifyOtp = async (email: string, otp: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.resetToken) {
        toast.success(data.message || "Verification code verified successfully!");
        return data.data.resetToken;
      } else {
        toast.error(data.message || "Invalid verification code.");
        return null;
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error during OTP verification.");
      return null;
    }
  };

  // Reset Password handler
  const resetPassword = async (
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Password updated successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to reset password.");
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error during password reset.");
      return false;
    }
  };

  // Update profile (name / avatar) via backend
  const updateProfile = async (name: string, avatar: string): Promise<boolean> => {
    try {
      const res = await authenticatedFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.data.profile);
        toast.success(data.message || "Profile updated successfully.");
        return true;
      }
      toast.error(data.message || "Failed to update profile.");
      return false;
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error. Please try again.");
      return false;
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      toast.success("Logged out successfully.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
        googleLogin,
        forgotPassword,
        verifyOtp,
        resetPassword,
        refreshAuthSession,
        updateProfile,
        authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
