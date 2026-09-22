"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { CartLine, DetailedLine } from "@/lib/shop";

const CART_KEY = "gsbd-cart";
const MAX_QTY = 10;

// The cart lives in localStorage and is exposed through useSyncExternalStore, so the server render and the
// first client render both see an empty cart and React swaps in the stored one right after hydration.
const listeners = new Set<() => void>();
const EMPTY = "[]";

function subscribeCart(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // keep other tabs in sync
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function readCartRaw(): string {
  try {
    return localStorage.getItem(CART_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeCart(items: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private-mode errors
  }
  listeners.forEach((l) => l());
}

function parseCart(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    // Only validate shape — product existence is verified by the API
    return parsed
      .filter((l) => typeof l.id === "string" && l.id && typeof l.qty === "number" && l.qty > 0)
      .map((l) => ({ id: l.id, qty: Math.min(l.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

const noopSubscribe = () => () => {};

interface CartContextType {
  /** Lines with server-verified pricing. Empty until first API response. */
  lines: DetailedLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  /** True while cart pricing is being fetched from the server */
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Raw cart items from localStorage (id + qty only, no prices) */
  rawItems: CartLine[];
  addItem: (id: string, qty?: number, opts?: { openDrawer?: boolean; silent?: boolean; name?: string }) => void;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeCart, readCartRaw, () => EMPTY);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const items = useMemo(() => parseCart(raw), [raw]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverLines, setServerLines] = useState<DetailedLine[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch server-verified pricing whenever items change
  useEffect(() => {
    if (!hydrated || items.length === 0) {
      queueMicrotask(() => setServerLines([]));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cart/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (!cancelled && res.ok) {
          const json = await res.json();
          if (json.success && json.data?.lines) {
            setServerLines(json.data.lines);
          }
        }
      } catch {
        // Keep showing last known prices on network error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150); // small debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [items, hydrated]);

  // Lock page scroll while the drawer is open, close it on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const addItem = useCallback<CartContextType["addItem"]>((id, qty = 1, opts = {}) => {
    const cur = parseCart(readCartRaw());
    const existing = cur.find((l) => l.id === id);
    writeCart(
      existing
        ? cur.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l))
        : [...cur, { id, qty: Math.min(qty, MAX_QTY) }]
    );
    if (!opts.silent) toast.success(`${opts.name ?? "Item"} added to cart`);
    if (opts.openDrawer !== false) setDrawerOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const cur = parseCart(readCartRaw());
    writeCart(qty <= 0 ? cur.filter((l) => l.id !== id) : cur.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)));
  }, []);

  const removeItem = useCallback((id: string) => writeCart(parseCart(readCartRaw()).filter((l) => l.id !== id)), []);
  const clear = useCallback(() => writeCart([]), []);

  const value = useMemo<CartContextType>(() => {
    return {
      lines: serverLines,
      count: serverLines.reduce((n, l) => n + l.qty, 0),
      subtotal: serverLines.reduce((n, l) => n + l.lineTotal, 0),
      hydrated,
      loading,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      rawItems: items,
      addItem,
      setQty,
      removeItem,
      clear,
    };
  }, [serverLines, hydrated, loading, drawerOpen, items, addItem, setQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export const MAX_CART_QTY = MAX_QTY;
