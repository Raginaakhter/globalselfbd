import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CheckCircle2, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { fetchSite } from "@/lib/site-fetch";
import ProductSection from "@/components/landing/ProductSection";
import PurchasePanel from "@/components/shop/PurchasePanel";
import ProductImage from "@/components/shop/ProductImage";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/shop";
import type { Product } from "@/lib/catalog";

type Params = { id: string };

type ProductDetailData = {
  product: Product;
  related: Product[];
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await apiFetch<ProductDetailData>(`/api/products/${id}`);
    const product = data.product;
    return {
      title: `${product.name} | Global Shelf BD`,
      description: `${product.brand} ${product.name} (${product.size}) — ${formatPrice(product.price)}. ${product.description}`.slice(0, 200),
    };
  } catch {
    return { title: "Product not found | Global Shelf BD" };
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let product: Product;
  let related: Product[];
  try {
    const data = await apiFetch<ProductDetailData>(`/api/products/${id}`);
    product = data.product;
    related = data.related;
  } catch {
    notFound();
  }

  const discountPercent = product.rrp && product.rrp > product.price
    ? Math.round(((product.rrp - product.price) / product.rrp) * 100)
    : 0;
  const { categories, settings, trustBadges } = await fetchSite();
  const category = categories.find((c) => c.slug === product.category);
  const assurances = [
    { icon: Truck, t: "Fast delivery", s: `Free over ${formatPrice(settings.freeShippingThreshold)}` },
    ...[
      { icon: ShieldCheck, badge: trustBadges.find((b) => /authentic/i.test(b.title)) },
      { icon: RotateCcw, badge: trustBadges.find((b) => /return/i.test(b.title)) },
    ].flatMap(({ icon, badge }) => (badge ? [{ icon, t: badge.title, s: badge.body }] : [])),
  ];
  const off = discountPercent;
  const lowStock = product.stock <= 15;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-4 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-brand-700">Shop</Link>
          {category && (
            <>
              <span>/</span>
              <Link href={`/shop?category=${category.slug}`} className="hover:text-brand-700">{category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="font-semibold text-navy-700 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-8">
          {/* Gallery */}
          <div>
            <div className={`relative aspect-square rounded-3xl ${product.tint} flex items-center justify-center overflow-hidden`}>
              {off > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-coral-500 text-white text-xs font-black">{off}% OFF</span>
              )}
              {product.badge === "NEW" && (
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-navy-600 text-white text-xs font-black">NEW</span>
              )}
              <ProductImage image={product.image} emoji={product.emoji} alt={product.name} emojiClass="text-[9rem] sm:text-[12rem] leading-none drop-shadow-lg animate-float select-none" />
            </div>
            {/* Decorative emoji views only make sense for the placeholder tile, not for a real photo */}
            {!product.image && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Front", scale: "scale-100" },
                { label: "Pack", scale: "scale-75" },
                { label: "Detail", scale: "scale-125" },
              ].map((v) => (
                <div key={v.label} className={`aspect-[4/3] rounded-2xl ${product.tint} border border-slate-200 flex items-center justify-center overflow-hidden`}>
                  <span className={`text-4xl ${v.scale}`}>{product.emoji}</span>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs font-black uppercase tracking-widest text-brand-700">{product.brand}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-700 tracking-tight leading-tight mt-1.5">{product.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{product.size}</p>

            {product.reviews > 0 && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <div className="flex" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-sun-400 text-sun-400" : "text-slate-300"}`} />
                ))}
              </div>
              <span className="font-bold text-navy-700">{product.rating.toFixed(1)}</span>
              <span className="text-slate-500">({product.reviews} reviews)</span>
            </div>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-black text-brand-700">{formatPrice(product.price)}</span>
              {product.rrp && (
                <>
                  <span className="text-lg text-slate-400 line-through">RRP {formatPrice(product.rrp)}</span>
                  <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-black">
                    You save {formatPrice(product.rrp - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className={`mt-3 inline-flex items-center gap-2 text-sm font-bold ${lowStock ? "text-sun-500" : "text-brand-700"}`}>
              <CheckCircle2 className="w-4 h-4" />
              {lowStock ? `Only ${product.stock} left in stock — order soon` : "In stock — ready to ship"}
            </p>

            <p className="text-sm text-slate-600 leading-relaxed mt-4">{product.description}</p>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <PurchasePanel product={product} />
            </div>

            <ul className="mt-6 grid sm:grid-cols-3 gap-3 text-xs">
              {assurances.map(({ icon: Icon, t, s }) => (
                <li key={t} className="flex items-center gap-2.5 rounded-2xl bg-brand-50 border border-brand-100 p-3">
                  <Icon className="w-5 h-5 text-brand-700 shrink-0" />
                  <span>
                    <span className="block font-bold text-navy-700">{t}</span>
                    <span className="text-slate-500">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-navy-700 mb-4">Key benefits</h2>
            <ul className="space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-sm text-slate-700">
                  <BadgeCheck className="w-5 h-5 text-brand-600 shrink-0" /> {h}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-navy-700 mb-4">Product details</h2>
            <dl className="text-sm divide-y divide-slate-100">
              {[
                ["Brand", product.brand],
                ["Category", category?.name ?? product.category],
                ["Pack size", product.size],
                ["Product code", product.id.toUpperCase()],
                ["Delivery", "Dhaka 1–2 days · Nationwide 2–4 days"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-semibold text-navy-700 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <ProductSection id="related" title="You May Also Like" bn="আপনার পছন্দ হতে পারে" products={related} href={category ? `/shop?category=${category.slug}` : "/shop"} />
    </>
  );
}
