"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Banknote, Loader2, Lock, MapPin, Smartphone, CreditCard, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSite } from "@/context/SiteContext";
import { formatPrice, type ShippingZone } from "@/lib/shop";
import OrderSummary from "@/components/shop/OrderSummary";
import type { DetailedLine } from "@/lib/shop";

type Form = { name: string; phone: string; email: string; address: string; area: string; zone: ShippingZone; note: string };
type Errors = Partial<Record<keyof Form, string>>;

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!BD_PHONE.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid Bangladeshi mobile number (e.g. 01712345678).";
  if (!f.email.trim()) e.email = "Please enter your email address — we'll send your order confirmation and use it for order tracking.";
  else if (!EMAIL.test(f.email)) e.email = "Enter a valid email address.";
  if (f.address.trim().length < 8) e.address = "Please enter your full delivery address.";
  if (f.area.trim().length < 2) e.area = "Please enter your area / district.";
  return e;
}

const inputCls = (err?: string) =>
  `w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-4 ${
    err ? "border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-brand-600 focus:ring-brand-600/15"
  }`;

function Field({ label, error, children, optional }: { label: string; error?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">
        {label} {optional && <span className="text-slate-400 normal-case font-medium">(optional)</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-rose-600 font-medium mt-1.5">{error}</span>}
    </label>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, authenticatedFetch } = useAuth();
  const cart = useCart();
  const { settings } = useSite();

  const buyId = params.get("buy");
  const buyQty = Math.min(Math.max(parseInt(params.get("qty") ?? "1", 10) || 1, 1), 10);
  const isBuyNow = Boolean(buyId);

  // Items to use — either the buy-now item or the full cart
  const itemsForCalc = useMemo(
    () => (isBuyNow && buyId ? [{ id: buyId, qty: buyQty }] : cart.rawItems),
    [isBuyNow, buyId, buyQty, cart.rawItems]
  );

  // Fetch server-computed pricing for these items
  const [serverLines, setServerLines] = useState<DetailedLine[]>([]);
  const [serverSubtotal, setServerSubtotal] = useState(0);
  const [serverShipping, setServerShipping] = useState(0);
  const [serverTotal, setServerTotal] = useState(0);
  const [priceLoaded, setPriceLoaded] = useState(false);

  const [edits, setEdits] = useState<Partial<Form>>({});
  const form: Form = { name: user?.name ?? "", phone: "", email: user?.email ?? "", address: "", area: "", zone: "dhaka", note: "", ...edits };
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);

  // Fetch pricing from API whenever items or zone change
  useEffect(() => {
    if (itemsForCalc.length === 0) {
      queueMicrotask(() => {
        setServerLines([]);
        setServerSubtotal(0);
        setServerShipping(0);
        setServerTotal(0);
        setPriceLoaded(true);
      });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsForCalc, zone: form.zone }),
        });
        if (!cancelled && res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setServerLines(json.data.lines);
            setServerSubtotal(json.data.subtotal);
            setServerShipping(json.data.shipping);
            setServerTotal(json.data.total);
          }
        }
      } catch {
        // Keep last known prices
      } finally {
        if (!cancelled) setPriceLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [itemsForCalc, form.zone]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setEdits((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setPlacing(true);
    try {
      // Logged-in users place the order through authenticatedFetch so the backend can verify who
      // they are from the access token and correctly attach the order to their account — a plain
      // fetch (and any client-supplied userId) is never trusted for that.
      const doFetch = user ? authenticatedFetch : fetch;
      const res = await doFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsForCalc,
          customer: {
            name: form.name.trim(),
            phone: form.phone.replace(/[\s-]/g, ""),
            email: form.email,
            address: form.address.trim(),
            area: form.area.trim(),
            zone: form.zone,
            note: form.note,
          },
          payment: "cod",
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (!isBuyNow) cart.clear();
        toast.success("Order placed successfully!");
        // Stash the freshly-placed order so the success page can render it instantly and, for
        // guest checkouts, re-fetch it later without needing to re-enter anything.
        try {
          sessionStorage.setItem(`gs-order-${data.data.id}`, JSON.stringify(data.data));
        } catch {
          // sessionStorage unavailable (private mode) — the success page will fall back to the API
        }
        const emailQuery = !user && form.email ? `?email=${encodeURIComponent(form.email.trim().toLowerCase())}` : "";
        router.replace(`/order-success/${data.data.id}${emailQuery}`);
      } else {
        toast.error(data.message || "Failed to place order. Please try again.");
        setPlacing(false);
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
      setPlacing(false);
    }
  };

  if (!priceLoaded && !isBuyNow && !cart.hydrated) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10"><div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse" /></div>;
  }

  if (serverLines.length === 0 && priceLoaded) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-14 text-center">
        <div className="w-28 h-28 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-6xl mb-5">🛍️</div>
        <h1 className="text-2xl font-black text-navy-700">Nothing to check out yet</h1>
        <p className="text-slate-500 mt-2 mb-6">Add a few products to your cart first.</p>
        <Link href="/shop" className="inline-block px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight">{isBuyNow ? "Buy Now" : "Checkout"}</h1>
        <Link href={isBuyNow && buyId ? `/product/${buyId}` : "/cart"} className="text-sm font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> {isBuyNow ? "Back to product" : "Back to cart"}
        </Link>
      </div>

      <form onSubmit={placeOrder} noValidate className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"><User className="w-4 h-4" /></span>
              Contact details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errors.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="Your full name" className={inputCls(errors.name)} />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={inputCls(errors.phone)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="name@example.com" className={inputCls(errors.email)} />
                </Field>
                <p className="text-[11px] text-slate-400 mt-1.5">We&apos;ll send your order confirmation here — you&apos;ll also use it to track your order.</p>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"><MapPin className="w-4 h-4" /></span>
              Delivery address
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([
                { v: "dhaka", t: "Inside Dhaka", s: `${formatPrice(settings.shippingInsideDhaka)} · 1–2 days` },
                { v: "outside", t: "Outside Dhaka", s: `${formatPrice(settings.shippingOutsideDhaka)} · 2–4 days` },
              ] as const).map((z) => (
                <button
                  key={z.v}
                  type="button"
                  onClick={() => set("zone", z.v)}
                  aria-pressed={form.zone === z.v}
                  className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${form.zone === z.v ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:border-brand-300"}`}
                >
                  <span className="block text-sm font-black text-navy-700">{z.t}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{z.s}</span>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full address" error={errors.address}>
                  <textarea rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" placeholder="House, road, block, landmark…" className={inputCls(errors.address)} />
                </Field>
              </div>
              <Field label="Area / District" error={errors.area}>
                <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Dhanmondi, Dhaka" className={inputCls(errors.area)} />
              </Field>
              <Field label="Order note" optional>
                <input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Delivery instructions" className={inputCls()} />
              </Field>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-black text-navy-700 mb-5">
              <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"><Banknote className="w-4 h-4" /></span>
              Payment method
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-2xl border-2 border-brand-600 bg-brand-50 p-4">
                <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-black text-navy-700">Cash on Delivery</p>
                  <p className="text-xs text-slate-500">Pay when your order arrives · ডেলিভারির সময় টাকা দিন</p>
                </div>
                <span className="w-5 h-5 rounded-full border-[5px] border-brand-600 bg-white" aria-label="Selected" />
              </div>
              {[
                { icon: Smartphone, t: "bKash / Nagad" },
                { icon: CreditCard, t: "Credit / Debit Card" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 opacity-60" aria-disabled="true">
                  <span className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center"><Icon className="w-5 h-5 text-slate-500" /></span>
                  <p className="flex-1 text-sm font-bold text-slate-600">{t}</p>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Coming soon</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-40">
          <OrderSummary lines={serverLines} subtotal={serverSubtotal} shipping={serverShipping}>
            <button
              type="submit"
              disabled={placing}
              className="mt-5 w-full py-4 rounded-full text-sm font-black text-white btn-primary-gradient flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {placing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Placing your order…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Place Order — {formatPrice(serverTotal)}
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3">By placing this order you agree to our Terms &amp; Refund Policy.</p>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 pt-10"><div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
