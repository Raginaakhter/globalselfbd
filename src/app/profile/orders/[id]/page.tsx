"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import OrderDetailView from "@/components/orders/OrderDetailView";
import type { OrderData } from "@/lib/order-types";
import { ArrowLeft, Loader2, PackageX } from "lucide-react";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { authenticatedFetch, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // authenticatedFetch attaches the signed-in user's token; the API only returns this order
        // if it actually belongs to them.
        const res = await authenticatedFetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          setError(data.message || "Order not found, or it doesn't belong to your account.");
        }
      } catch {
        setError("Network error while loading this order.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading]);

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      <AccountHeader title="Order Details" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <Link href="/profile?tab=orders" className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-700 hover:text-cyan-800 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        {(loading || authLoading) && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        )}

        {!loading && !authLoading && error && (
          <div className="text-center py-16">
            <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">{error}</p>
            <Link href="/profile?tab=orders" className="inline-block mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient">
              Back to My Orders
            </Link>
          </div>
        )}

        {!loading && !authLoading && order && <OrderDetailView order={order} />}
      </main>
    </div>
  );
}
