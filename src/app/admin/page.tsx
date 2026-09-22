"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import { StatusBadge } from "@/components/orders/StatusTimeline";
import { formatPrice } from "@/lib/shop";
import type { OrderSummaryData } from "@/lib/order-types";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { ChevronLeft, ChevronRight, Loader2, Search, ShieldAlert, ShieldCheck } from "lucide-react";

function AdminOrdersDashboard() {
  const { authenticatedFetch } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (opts: { q: string; status: string; page: number }) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (opts.q) params.set("q", opts.q);
        if (opts.status !== "all") params.set("status", opts.status);
        params.set("page", String(opts.page));
        const res = await authenticatedFetch(`/api/admin/orders?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setOrders(data.data.orders);
          setTotalPages(data.data.pagination.totalPages);
          setTotal(data.data.pagination.total);
        } else {
          setError(data.message || "Failed to load orders.");
        }
      } catch {
        setError("Network error while loading orders.");
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  useEffect(() => {
    queueMicrotask(() => load({ q, status, page }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load({ q, status, page: 1 });
  };

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      <AccountHeader title="Admin — Orders" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> Order Management
          </h1>
          <p className="text-sm text-slate-500">{total} order{total === 1 ? "" : "s"} total</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6 flex flex-wrap gap-3 items-center">
          <form onSubmit={submitSearch} className="flex-1 min-w-[240px] flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by Order ID, name, phone or email…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer">
              Search
            </button>
          </form>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            </div>
          )}

          {!loading && error && <p className="p-6 text-sm font-semibold text-rose-600">{error}</p>}

          {!loading && !error && orders.length === 0 && (
            <p className="p-10 text-center text-sm font-semibold text-slate-500">No orders match your filters.</p>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{o.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{o.customerName}</p>
                        <p className="text-xs text-slate-400">{o.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">{formatPrice(o.total)}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/admin/orders/${o.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-400" />
        <h1 className="text-xl font-black text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500 max-w-sm">This area is only available to Global Shelf BD administrators.</p>
        <Link href="/" className="mt-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient">
          Back to Home
        </Link>
      </div>
    );
  }

  return <AdminOrdersDashboard />;
}
