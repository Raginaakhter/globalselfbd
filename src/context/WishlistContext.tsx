"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface WishlistContextType {
  /** Product IDs currently in the signed-in user's wishlist. Empty (and not fetched) for guests. */
  ids: Set<string>;
  count: number;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  /**
   * Add/remove a product from the wishlist. Wishlisting is an account-only feature: if the
   * visitor isn't signed in, this sends them to /login (with a redirect back to where they were)
   * instead of calling the API.
   */
  toggle: (productId: string, productName?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authenticatedFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/wishlist");
      const data = await res.json();
      if (data.success) {
        setIds(new Set<string>(data.data.productIds));
      }
    } catch {
      // Keep whatever we last knew — the heart icons will just reflect stale state until retried.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch]);

  // Load the wishlist once we know whether the visitor is signed in, and again on login/logout.
  useEffect(() => {
    if (authLoading) return;
    // Deferred to a microtask so state updates from refresh() happen outside the effect's
    // synchronous pass (satisfies react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const toggle = useCallback(
    async (productId: string, productName?: string) => {
      if (!isAuthenticated) {
        toast.info("Please sign in to save items to your wishlist.");
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
        return;
      }

      // Optimistic update so the heart flips instantly.
      const wasWishlisted = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        const res = await authenticatedFetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update wishlist");
        }
        toast.success(
          data.data.wishlisted
            ? `${productName ?? "Item"} added to wishlist`
            : `${productName ?? "Item"} removed from wishlist`
        );
      } catch (err) {
        // Roll back the optimistic change on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasWishlisted) next.add(productId);
          else next.delete(productId);
          return next;
        });
        toast.error(err instanceof Error ? err.message : "Failed to update wishlist");
      }
    },
    [isAuthenticated, ids, authenticatedFetch, router, pathname]
  );

  const value = useMemo<WishlistContextType>(
    () => ({
      ids,
      count: ids.size,
      loading,
      isWishlisted: (productId: string) => ids.has(productId),
      toggle,
      refresh,
    }),
    [ids, loading, toggle, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
