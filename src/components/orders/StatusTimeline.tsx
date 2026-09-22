"use client";

import React from "react";
import { CheckCircle2, Circle, ClipboardCheck, PackageCheck, PackageSearch, Truck, XCircle } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus, orderStatusFlowIndex } from "@/lib/order-status";

const STEP_ICONS: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  pending: ClipboardCheck,
  confirmed: CheckCircle2,
  processing: PackageSearch,
  out_for_delivery: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

export default function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
        <XCircle className="w-6 h-6 shrink-0" />
        <div>
          <p className="font-black">Order Cancelled</p>
          <p className="text-sm text-rose-600/80">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const activeIndex = Math.max(orderStatusFlowIndex(status), 0);

  return (
    <div className="flex items-start justify-between gap-1 sm:gap-2">
      {ORDER_STATUS_FLOW.map((step, i) => {
        const done = i <= activeIndex;
        const Icon = STEP_ICONS[step];
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <span
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-slate-300"
                }`}
              >
                {done ? <Icon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Circle className="w-4 h-4 sm:w-5 sm:h-5" />}
              </span>
              <span className={`mt-2 text-[10px] sm:text-xs font-bold leading-tight ${done ? "text-blue-950" : "text-slate-400"}`}>
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
            {i < ORDER_STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 flex-1 mt-4.5 sm:mt-[22px] rounded-full ${i < activeIndex ? "bg-blue-900" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cancelled = status === "cancelled";
  const delivered = status === "delivered";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
        cancelled
          ? "bg-rose-50 text-rose-600"
          : delivered
          ? "bg-emerald-50 text-emerald-700"
          : "bg-blue-50 text-blue-900"
      }`}
    >
      {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
    </span>
  );
}
