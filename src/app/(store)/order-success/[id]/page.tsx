"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Home, MapPin, Package, Phone, ShoppingBag, Wallet, PackageSearch } from "lucide-react";
import { formatPrice } from "@/lib/shop";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/orders/StatusTimeline";

const CONFETTI = ["#22c55e", "#16a34a", "#fbbf24", "#1e3a6e", "#f43f5e", "#34d399", "#f59e0b"];

type OrderData = {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  area: string;
  zone: string;
  note: string;
  payment: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: { id: string; name: string; emoji: string; size: string; price: number; qty: number; lineTotal: number }[];
};

function Confetti() {
  // Deterministic pseudo-random layout keeps server and client markup identical.
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    left: (i * 97) % 100,
    delay: ((i * 37) % 100) / 100,
    duration: 2.4 + ((i * 53) % 18) / 10,
    color: CONFETTI[i % CONFETTI.length],
    rotate: (i * 47) % 360,
    round: i % 3 === 0,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute -top-4 block w-2.5 h-3.5"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${0.5 + p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function SuccessCheck() {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <span className="absolute inset-0 rounded-full bg-brand-400/30 success-ring" />
      <span className="absolute inset-0 rounded-full bg-brand-400/20 success-ring [animation-delay:0.35s]" />
      <svg viewBox="0 0 120 120" className="relative w-32 h-32 success-pop" role="img" aria-label="Order placed successfully">
        <circle cx="60" cy="60" r="54" fill="#f0fdf4" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" className="success-circle" />
        <path d="M36 62 L54 80 L86 42" fill="none" stroke="#16a34a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="success-tick" />
      </svg>
    </div>
  );
}

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, authenticatedFetch } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load the order: first from the sessionStorage snapshot written by checkout (instant, works
  // even for guests who gave no email), then fall back to the API — authenticated for logged-in
  // users, or with the ?email= we carried over in the URL for guests reloading this page.
  useEffect(() => {
    (async () => {
      try {
        const cached = sessionStorage.getItem(`gs-order-${id}`);
        if (cached) {
          setOrder(JSON.parse(cached));
          setLoaded(true);
          return;
        }
      } catch {
        // sessionStorage unavailable — fall through to the API
      }

      try {
        const email = searchParams.get("email");
        const query = email ? `?email=${encodeURIComponent(email)}` : "";
        const res = await (isAuthenticated ? authenticatedFetch(`/api/orders/${id}`) : fetch(`/api/orders/${id}${query}`));
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setOrder(json.data);
          }
        }
      } catch {
        // Order details unavailable
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const trackOrder = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/profile/orders/${id}`)}`);
      return;
    }
    router.push(`/profile/orders/${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
      <Confetti />

      <div className="text-center">
        <SuccessCheck />
        <h1 className="text-3xl sm:text-4xl font-black text-navy-700 tracking-tight mt-6 fade-up" style={{ animationDelay: "0.9s" }}>
          Order placed successfully!
        </h1>
        <p className="text-slate-600 mt-2 fade-up" style={{ animationDelay: "1s" }}>
          ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে।
        </p>
        <p className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-200 text-sm font-bold text-brand-800 fade-up" style={{ animationDelay: "1.1s" }}>
          <Package className="w-4 h-4" /> Order ID: <span className="font-black tracking-wider">{id}</span>
        </p>
        {loaded && order && (
          <p className="mt-2 fade-up" style={{ animationDelay: "1.15s" }}>
            <StatusBadge status={order.status} />
          </p>
        )}
      </div>

      {loaded && order && (
        <div className="mt-10 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden fade-up" style={{ animationDelay: "1.25s" }}>
          <div className="grid sm:grid-cols-3 gap-px bg-slate-100 text-sm">
            {[
              { icon: CalendarClock, t: "Estimated delivery", v: order.zone === "dhaka" ? "1–2 business days" : "2–4 business days" },
              { icon: Wallet, t: "Payment", v: `Cash on Delivery · ${formatPrice(order.total)}` },
              { icon: Phone, t: "We'll call", v: order.customerPhone },
            ].map(({ icon: Icon, t, v }) => (
              <div key={t} className="bg-white p-4 flex items-start gap-3">
                <Icon className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">{t}</p>
                  <p className="font-bold text-navy-700">{v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            <p className="flex items-start gap-2 text-sm text-slate-600 mb-5">
              <MapPin className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <span>
                <span className="font-bold text-navy-700">{order.customerName}</span> — {order.address}, {order.area}
              </span>
            </p>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <li key={it.id} className="py-3 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-xl">{it.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy-700 line-clamp-1">{it.name}</p>
                    <p className="text-xs text-slate-500">{it.size} × {it.qty}</p>
                  </div>
                  <p className="text-sm font-black text-navy-700">{formatPrice(it.price * it.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="font-bold">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd className="font-bold">{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</dd></div>
              <div className="flex justify-between items-baseline pt-2"><dt className="font-black text-navy-700">Total to pay</dt><dd className="text-xl font-black text-brand-700">{formatPrice(order.total)}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {loaded && !order && (
        <p className="mt-8 text-center text-sm text-slate-500 fade-up" style={{ animationDelay: "1.25s" }}>
          Your order details couldn&apos;t be loaded, but your order is confirmed — keep the Order ID above for reference.
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3 fade-up" style={{ animationDelay: "1.4s" }}>
        <button
          type="button"
          onClick={trackOrder}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient cursor-pointer"
        >
          <PackageSearch className="w-4 h-4" /> Track Order
        </button>
        <Link href="/" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-navy-700 border-2 border-navy-700 hover:bg-navy-50 transition-colors">
          <Home className="w-4 h-4" /> Go to Home
        </Link>
      </div>
      <div className="mt-4 text-center fade-up" style={{ animationDelay: "1.45s" }}>
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800">
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
