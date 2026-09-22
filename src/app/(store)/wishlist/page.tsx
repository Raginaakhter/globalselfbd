"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/landing/ProductCard";
import type { Product } from "@/lib/catalog";

export default function WishlistPage() {
  const { authenticatedFetch, loading: authLoading } = useAuth();
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setError("");
      try {
        const res = await authenticatedFetch("/api/wishlist");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.products);
        } else {
          setError(data.message || "Failed to load your wishlist.");
        }
      } catch {
        setError("Network error while loading your wishlist.");
      }
    })();
    // Re-fetch whenever the wishlist changes elsewhere (e.g. a heart toggled from another card),
    // so removing the last item here updates this page immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, ids.size]);

  const loading = authLoading || products === null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-2xl bg-coral-50 text-coral-500 flex items-center justify-center">
          <Heart className="w-5 h-5 fill-coral-500" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight">My Wishlist</h1>
          <p className="text-sm text-slate-500">{products?.length ?? 0} saved item{(products?.length ?? 0) === 1 ? "" : "s"}</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {!loading && !error && products?.length === 0 && (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-black text-navy-700">Your wishlist is empty</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Tap the heart on any product to save it here for later.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white btn-primary-gradient">
            <ShoppingBag className="w-4 h-4" /> Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && products && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
