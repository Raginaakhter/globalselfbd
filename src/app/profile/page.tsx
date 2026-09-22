"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/account/AccountHeader";
import { StatusBadge } from "@/components/orders/StatusTimeline";
import { formatPrice } from "@/lib/shop";
import type { OrderSummaryData } from "@/lib/order-types";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Pencil,
  Loader2,
  Save,
  X,
  Package,
  ChevronRight,
  ShieldCheck,
  Inbox,
} from "lucide-react";

function ProfileContent() {
  const { user, updateProfile, authenticatedFetch, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"account" | "orders">(searchParams.get("tab") === "orders" ? "orders" : "account");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  const [orders, setOrders] = useState<OrderSummaryData[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Load the latest profile from the backend
  useEffect(() => {
    if (!user) return;
    authenticatedFetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setName(data.data.profile.name ?? "");
          setAvatar(data.data.profile.avatar ?? "");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load "My Orders" — a logged-in user can only ever see their own orders (the API scopes the
  // query to the authenticated user's id, so there is nothing to leak here even if requested).
  const loadOrders = React.useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await authenticatedFetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
      } else {
        setOrdersError(data.message || "Failed to load your orders.");
      }
    } catch {
      setOrdersError("Network error while loading your orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (tab === "orders" && orders === null && user) queueMicrotask(() => loadOrders());
  }, [tab, orders, user, loadOrders]);

  const startEditing = () => {
    setName(user?.name ?? "");
    setAvatar(user?.avatar ?? "");
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile(name, avatar);
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";

  return (
    <div className="min-h-screen bg-mesh-light bg-dot-pattern flex flex-col">
      <AccountHeader title="My Account" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[3px] shadow-xl shadow-cyan-500/20 mb-4">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl font-black text-cyan-600 overflow-hidden">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : "U"
              )}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Go to Admin Dashboard
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm w-fit mx-auto">
          <button
            onClick={() => setTab("account")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "account" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "orders" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            My Orders
          </button>
        </div>

        {tab === "account" ? (
          <div className="auth-card rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-cyan-600" />
                <span>Personal & Security Information</span>
              </h2>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="avatar" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Avatar URL (optional)
                  </label>
                  <input
                    id="avatar"
                    type="url"
                    placeholder="https://..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                  <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user?.email} (cannot be changed)</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user?.email}</span>
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Authentication Method</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                    {user?.provider || "local"} Account
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Member Since</span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-card rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
              <Package className="w-5 h-5 text-cyan-600" />
              <span>My Orders</span>
            </h2>

            {ordersLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}

            {!ordersLoading && ordersError && (
              <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {ordersError}
              </p>
            )}

            {!ordersLoading && !ordersError && orders?.length === 0 && (
              <div className="text-center py-10">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">You haven&apos;t placed any orders yet.</p>
                <Link href="/shop" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-gradient">
                  Start Shopping
                </Link>
              </div>
            )}

            {!ordersLoading && orders && orders.length > 0 && (
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/profile/orders/${o.id}`}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors"
                    >
                      <span className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-xl shrink-0">{o.firstItemEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                          {o.id}
                          <StatusBadge status={o.status} />
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {o.firstItemName}
                          {o.itemCount > 1 ? ` + ${o.itemCount - 1} more` : ""} · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{formatPrice(o.total)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-600 animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
