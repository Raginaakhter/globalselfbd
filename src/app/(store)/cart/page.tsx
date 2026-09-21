"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shop";
import { useSite } from "@/context/SiteContext";
import QuantityStepper from "@/components/shop/QuantityStepper";
import OrderSummary from "@/components/shop/OrderSummary";

export default function CartPage() {
  const { lines, subtotal, hydrated, setQty, removeItem, clear } = useCart();
  const FREE_SHIPPING_THRESHOLD = useSite().settings.freeShippingThreshold;
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  if (!hydrated) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10"><div className="h-72 rounded-3xl bg-white border border-slate-200 animate-pulse" /></div>;
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-14 text-center">
        <div className="w-28 h-28 mx-auto rounded-full bg-brand-50 flex items-center justify-center text-6xl mb-5 animate-float">🛒</div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-700">Your cart is empty</h1>
        <p className="text-slate-500 mt-2 mb-6">আপনার কার্ট এখন খালি। পছন্দের পণ্য বেছে নিন!</p>
        <Link href="/shop" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient">
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight">Shopping Cart</h1>
        <button onClick={clear} className="text-sm font-semibold text-slate-500 hover:text-coral-500 flex items-center gap-1.5 cursor-pointer">
          <Trash2 className="w-4 h-4" /> Clear cart
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-4">
          <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-3.5">
            <p className="flex items-center gap-2 text-sm font-bold text-brand-800">
              <Truck className="w-4 h-4" />
              {remaining === 0 ? "You've unlocked FREE delivery! 🎉" : `Add ${formatPrice(remaining)} more to get FREE delivery`}
            </p>
            <div className="mt-2 h-2 rounded-full bg-white overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }} />
            </div>
          </div>

          <ul className="rounded-3xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
            {lines.map(({ product, qty, lineTotal }) => (
              <li key={product.id} className="p-4 sm:p-5 flex gap-4">
                <Link href={`/product/${product.id}`} className={`w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl ${product.tint} flex items-center justify-center text-5xl`}>
                  {product.emoji}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{product.brand}</p>
                      <Link href={`/product/${product.id}`} className="text-sm sm:text-base font-bold text-navy-700 hover:text-brand-700 line-clamp-2">
                        {product.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{product.size} · {formatPrice(product.price)} each</p>
                    </div>
                    <button onClick={() => removeItem(product.id)} aria-label={`Remove ${product.name}`} className="self-start p-2 rounded-full text-slate-400 hover:text-coral-500 hover:bg-rose-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <QuantityStepper size="sm" value={qty} onChange={(n) => setQty(product.id, n)} />
                    <p className="text-lg font-black text-brand-700">{formatPrice(lineTotal)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
            <ArrowLeft className="w-4 h-4" /> Continue shopping
          </Link>
        </div>

        <div className="lg:sticky lg:top-40">
          <OrderSummary lines={lines} subtotal={subtotal} showItems={false}>
            <Link href="/checkout" className="mt-5 w-full py-3.5 rounded-full text-sm font-black text-white btn-primary-gradient flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-slate-500 text-center mt-3">Secure checkout · Cash on delivery available</p>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
