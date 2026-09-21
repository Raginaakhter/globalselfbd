"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart, Zap } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "./QuantityStepper";

export default function PurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.min(product.stock, 10);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addItem(product.id, qty, { name: product.name });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  // Buy now skips the cart: checkout receives just this product.
  const handleBuyNow = () => router.push(`/checkout?buy=${product.id}&qty=${qty}`);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper value={qty} onChange={setQty} max={max} />
        <p className="text-sm text-slate-500">
          Total: <span className="font-black text-navy-700 text-base">{formatPrice(product.price * qty)}</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={`py-3.5 px-6 rounded-full text-sm font-black flex items-center justify-center gap-2 border-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            added ? "bg-brand-600 border-brand-600 text-white scale-[1.02]" : "border-brand-600 text-brand-700 hover:bg-brand-50"
          }`}
        >
          {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          {added ? "Added to cart!" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="py-3.5 px-6 rounded-full text-sm font-black flex items-center justify-center gap-2 text-white btn-primary-gradient cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5" /> Buy Now
        </button>
      </div>
    </div>
  );
}
