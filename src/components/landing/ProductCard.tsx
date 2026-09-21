"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Heart, Plus, Star } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/shop/ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { id, name, size, price, rrp, emoji, tint, badge, rating, reviews, brand, image } = product;

  const handleAdd = () => {
    addItem(id, 1, { name });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="product-card group relative flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {badge && (
        <span
          className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide ${
            badge === "NEW" ? "bg-navy-600 text-white" : "bg-coral-500 text-white"
          }`}
        >
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={() => setLiked((v) => !v)}
        aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={liked}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-coral-500 text-coral-500" : "text-slate-400"}`} />
      </button>

      <Link href={`/product/${id}`} aria-label={`View ${name}`} className={`aspect-square ${tint} flex items-center justify-center text-6xl sm:text-7xl overflow-hidden`}>
        <ProductImage image={image} emoji={emoji} alt={name} emojiClass="drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
      </Link>

      <div className="flex-1 flex flex-col p-3.5 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{brand}</p>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 mb-1.5 min-h-4">
          {reviews > 0 && (<>
          <Star className="w-3.5 h-3.5 fill-sun-400 text-sun-400" />
          <span className="font-bold text-navy-700">{rating.toFixed(1)}</span>
          <span>({reviews})</span>
          </>)}
        </div>
        <h3 className="text-sm font-bold text-navy-700 leading-snug line-clamp-2 min-h-[2.5rem]">
          <Link href={`/product/${id}`} className="hover:text-brand-700 transition-colors">
            {name}
          </Link>
        </h3>
        <p className="text-xs text-slate-500 mt-1">{size}</p>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black text-brand-700 leading-none">{formatPrice(price)}</p>
            {rrp && <p className="text-xs text-slate-400 line-through mt-1">RRP {formatPrice(rrp)}</p>}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${name} to cart`}
            className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer ${
              justAdded ? "bg-navy-600 shadow-navy-600/30" : "bg-brand-600 hover:bg-brand-700 shadow-brand-600/30"
            }`}
          >
            {justAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </article>
  );
}
