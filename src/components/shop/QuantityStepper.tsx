"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_CART_QTY } from "@/context/CartContext";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
};

export default function QuantityStepper({ value, onChange, min = 1, max = MAX_CART_QTY, size = "md" }: Props) {
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const btn = `${dim} flex items-center justify-center rounded-full text-navy-700 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer`;

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5" role="group" aria-label="Quantity">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="w-4 h-4" />
      </button>
      <span className={`${size === "sm" ? "w-7 text-sm" : "w-10 text-base"} text-center font-black text-navy-700 tabular-nums`} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
