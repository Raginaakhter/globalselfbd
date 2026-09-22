"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import OrderDetailView from "@/components/orders/OrderDetailView";
import type { OrderData } from "@/lib/order-types";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PackageX, ShieldAlert, Send } from "lucide-react";

function AdminOrderDetail({ id }: { id: string }) {
  const { authenticatedFetch } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextStatus, setNextStatus] = useState<OrderStatus>("pending");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authenticatedFetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        setNextStatus(data.data.status);
      } else {
        setError(data.message || "Order not found.");
      }
    } catch {
      setError("Network error while loading this order.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const updateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await authenticatedFetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Status updated");
        setOrder(data.data);
        setNote("");
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error while updating status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      <AccountHeader title="Admin — Order Detail" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:text-indigo-800 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">{error}</p>
          </div>
        )}

        {!loading && order && (
          <OrderDetailView order={order}>
            <form onSubmit={updateStatus} className="pt-5 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Order Status</p>
              <div className="flex flex-wrap gap-3">
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                  className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={updating || nextStatus === order.status}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Update Status
                </button>
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (e.g. courier tracking number)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                The customer will see this update immediately on their tracking page and profile, and will receive an email notification.
              </p>
            </form>
          </OrderDetailView>
        )}
      </main>
    </div>
  );
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
        <Link href="/" className="mt-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient">
          Back to Home
        </Link>
      </div>
    );
  }

  return <AdminOrderDetail id={id} />;
}
