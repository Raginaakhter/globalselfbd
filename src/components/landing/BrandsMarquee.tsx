"use client";

import SectionHeading from "./SectionHeading";
import { useSite } from "@/context/SiteContext";

// Scroll time per brand: the loop length grows with the number of brands so the speed stays constant.
const SECONDS_PER_BRAND = 4;

export default function BrandsMarquee() {
  const { brands } = useSite();
  if (brands.length === 0) return null;

  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...brands, ...brands];

  return (
    <section id="brands" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-32">
      <SectionHeading title="Shop Top Brands" bn="বিশ্বসেরা ব্র্যান্ডগুলো এক জায়গায়" linkLabel="All brands" />
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: `${Math.max(brands.length * SECONDS_PER_BRAND, 30)}s` }}
        >
          {loop.map((b, i) => (
            <span
              key={`${b}-${i}`}
              aria-hidden={i >= brands.length}
              className="px-6 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black tracking-wide text-navy-600 whitespace-nowrap hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition-colors"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
