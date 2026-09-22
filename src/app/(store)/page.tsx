import {
  Hero,
  TrustBar,
  CategoryGrid,
  ProductSection,
  PromoBanner,
  BrandsMarquee,
  DeliveryPromise,
  Newsletter,
} from "@/components/landing";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/catalog";

type FeaturedData = {
  bestSellers: Product[];
  topDeals: Product[];
  newArrivals: Product[];
};

export default async function Home() {
  let bestSellers: Product[] = [];
  let topDeals: Product[] = [];
  let newArrivals: Product[] = [];

  try {
    const data = await apiFetch<FeaturedData>("/api/products/featured");
    bestSellers = data.bestSellers;
    topDeals = data.topDeals;
    newArrivals = data.newArrivals;
  } catch (e) {
    console.error("Failed to fetch featured products:", e);
  }

  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryGrid />
      <ProductSection id="best-sellers" title="Best Selling Items" bn="সবচেয়ে বেশি বিক্রিত পণ্য" products={bestSellers} href="/shop?sort=popular" />
      <ProductSection id="deals" title="Top Deals — Save Big" bn="সেরা অফার, সেরা দাম" products={topDeals} tone="tinted" href="/shop?sort=discount" />
      <PromoBanner />
      <ProductSection id="new-arrivals" title="New Arrivals" bn="নতুন এসেছে" products={newArrivals} href="/shop?sort=new" />
      <BrandsMarquee />
      <DeliveryPromise />
      <Newsletter />
    </>
  );
}
