"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Package, ShoppingBag, LogIn } from "lucide-react";
import OrderDetailView from "@/components/orders/OrderDetailView";
import type { OrderData } from "@/lib/order-types";

function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const submit = async (idOverride?: string, emailOverride?: string) => {
    const id = (idOverride ?? orderId).trim();
    const emailInput = (emailOverride ?? email).trim();
    setError("");
    setOrder(null);

    if (!id) {
      setError("Please enter your Order ID.");
      return;
    }
    if (!emailInput) {
      setError("Please enter the email address used for the order.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, email: emailInput }),
      });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setError(json.message || "No order found with that Order ID and email. Please double-check and try again.");
        return;
      }

      setOrder(json.data as OrderData);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run the search once if we arrived here from an order confirmation email link.
  useEffect(() => {
    const qId = searchParams.get("orderId");
    const qEmail = searchParams.get("email");
    if (qId && qEmail && !autoSubmitted) {
      queueMicrotask(() => {
        setAutoSubmitted(true);
        submit(qId, qEmail);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoSubmitted]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center mb-8">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 mb-4">
          <Package className="w-7 h-7" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">Track Your Order</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Enter your Order ID and the email address used at checkout to see the latest status.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6 grid sm:grid-cols-2 gap-3"
      >
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order ID (e.g. GS-XXXXXX)"
          aria-label="Order ID"
          className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address used for the order"
          aria-label="Email address"
          className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          {loading ? "Searching…" : "Track Order"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-center text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {order && <div className="mt-8"><OrderDetailView order={order} /></div>}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-blue-900 border-2 border-blue-900 hover:bg-blue-50 transition-colors">
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
        <Link href="/login?redirect=/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-600 hover:text-blue-900 transition-colors">
          <LogIn className="w-4 h-4" /> Sign in to see all your orders
        </Link>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 pt-14"><div className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" /></div>}>
      <TrackOrderForm />
    </Suspense>
  );
}
