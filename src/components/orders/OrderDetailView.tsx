"use client";

import React from "react";
import { CalendarClock, MapPin, Phone, User } from "lucide-react";
import { formatPrice } from "@/lib/shop";
import type { OrderData } from "@/lib/order-types";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";
import StatusTimeline from "./StatusTimeline";

/** Full order detail card — customer info, items, totals, delivery info and status history.
 *  Shared by guest order tracking, the profile "My Orders" detail page, and the admin order page. */
export default function OrderDetailView({ order, children }: { order: OrderData; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <p className="text-sm font-bold text-slate-500">
            Order <span className="text-blue-950 font-black tracking-wide">{order.id}</span>
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <StatusTimeline status={order.status} />
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <p className="flex items-start gap-2 text-slate-600">
            <User className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <span>
              <span className="font-bold text-blue-950">{order.customerName}</span>
              {order.customerEmail && <><br />{order.customerEmail}</>}
            </span>
          </p>
          <p className="flex items-start gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <span>{order.customerPhone}</span>
          </p>
          <p className="flex items-start gap-2 text-slate-600 sm:col-span-2">
            <MapPin className="w-4 h-4 text-blue-900 mt-0.5 shrink-0" />
            <span>
              {order.address}, {order.area} ({order.zone === "dhaka" ? "Inside Dhaka" : "Outside Dhaka"})
              {order.note && <><br /><span className="text-xs text-slate-400">Note: {order.note}</span></>}
            </span>
          </p>
        </div>

        <ul className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
          {order.items.map((it, i) => (
            <li key={`${it.id}-${i}`} className="py-3 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">{it.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-950 line-clamp-1">{it.name}</p>
                <p className="text-xs text-slate-500">{it.size} × {it.qty}</p>
              </div>
              <p className="text-sm font-black text-blue-950">{formatPrice(it.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="pt-2 border-t border-slate-100 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd className="font-bold">{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd className="font-bold">{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</dd></div>
          <div className="flex justify-between items-baseline pt-2"><dt className="font-black text-blue-950">Total ({order.payment === "cod" ? "Cash on Delivery" : order.payment})</dt><dd className="text-xl font-black text-blue-900">{formatPrice(order.total)}</dd></div>
        </dl>

        {order.statusHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status History</p>
            <ul className="space-y-2">
              {order.statusHistory.slice().reverse().map((h, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-900 mt-1.5 shrink-0" />
                  <span className="text-slate-600">
                    <span className="font-bold text-blue-950">{ORDER_STATUS_LABELS[h.status as OrderStatus] ?? h.status}</span>
                    {" — "}
                    {new Date(h.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {h.note && <span className="text-slate-400"> · {h.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
