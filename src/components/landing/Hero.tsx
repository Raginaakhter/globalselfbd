"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function Hero() {
  const { heroSlides, sideBanners } = useSite();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = heroSlides.length;
  // keep the index valid if the number of slides changes
  const active = count ? index % count : 0;

  useEffect(() => {
    if (paused) return;
    if (count < 2) return;
    // Snappier than before: the first slide change now lands sooner instead of feeling stalled.
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 4200);
    return () => clearInterval(id);
  }, [paused, count]);

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Carousel */}
        <div
          className={`group relative overflow-hidden rounded-3xl shadow-xl min-h-[300px] sm:min-h-[380px] ${heroSlides.some((s) => s.image) ? "sm:aspect-[2752/1536]" : ""}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-roledescription="carousel"
        >
          <span className="shine-sweep z-20" />
          {heroSlides.map((s, i) => (
            <div
              key={s.title}
              aria-hidden={i !== active}
              className={`absolute inset-0 bg-gradient-to-br ${s.gradient} text-white transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                i === active ? "opacity-100 translate-x-0 scale-100" : "opacity-0 pointer-events-none translate-x-3 scale-[1.02]"
              }`}
            >
              {s.image ? (
                <Link href={s.href} className="absolute inset-0 block overflow-hidden" aria-label={s.title}>
                  <div key={i === active ? `active-${index}` : "idle"} className={`absolute inset-0 ${i === active ? "animate-ken-burns" : ""}`}>
                    <Image src={s.image} alt={s.title} fill priority={i === 0} sizes="(min-width: 1024px) 980px, 100vw" className="object-cover object-center" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </Link>
              ) : (
              <>
              {/* decorative blobs */}
              <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-24 left-1/3 w-72 h-72 rounded-full bg-black/10 blur-2xl" />

              <div className="relative h-full flex items-center px-6 sm:px-12 py-10">
                <div className="max-w-md">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11px] font-bold uppercase tracking-widest mb-4">
                    {s.eyebrow}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight mb-2">{s.title}</h1>
                  <p className="text-sm sm:text-base font-semibold text-white/90 mb-3">{s.bn}</p>
                  <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-sm">{s.body}</p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-navy-700 text-sm font-black shadow-lg hover:bg-sun-400 hover:-translate-y-0.5 transition-all"
                  >
                    {s.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Decorative area: a real round product photo when the slide has one, otherwise
                    the emoji cluster it always had. */}
                <div className="hidden sm:flex absolute right-10 lg:right-16 top-1/2 -translate-y-1/2 items-center justify-center w-56 h-56 lg:w-72 lg:h-72">
                  <div className="absolute inset-0 rounded-full bg-white/10 border border-white/20" />
                  {s.productImage ? (
                    <>
                      <div className="relative w-40 h-40 lg:w-52 lg:h-52 rounded-full overflow-hidden border-4 border-white/50 shadow-2xl bg-white animate-float">
                        <Image src={s.productImage} alt={s.title} fill sizes="208px" className="object-cover object-center" />
                      </div>
                      {s.emojis[1] && (
                        <span className="absolute top-0 right-2 text-4xl lg:text-5xl animate-float [animation-delay:-1.5s] drop-shadow-lg">
                          {s.emojis[1]}
                        </span>
                      )}
                      {s.emojis[2] && (
                        <span className="absolute bottom-2 left-0 text-3xl lg:text-4xl animate-float [animation-delay:-3s] drop-shadow-lg">
                          {s.emojis[2]}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="absolute text-7xl lg:text-8xl animate-float">{s.emojis[0]}</span>
                      <span className="absolute -top-2 right-2 text-4xl lg:text-5xl animate-float [animation-delay:-1.5s]">{s.emojis[1]}</span>
                      <span className="absolute bottom-0 left-2 text-4xl lg:text-5xl animate-float [animation-delay:-3s]">{s.emojis[2]}</span>
                    </>
                  )}
                </div>
              </div>
              </>
              )}
            </div>
          ))}

          {/* controls */}
          <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next slide" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {heroSlides.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${i === active ? "w-7 bg-white" : "w-2 bg-white/50"}`}
              />
            ))}
          </div>
        </div>

        {/* Side banners */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {sideBanners.map((b, i) => (
            <Link
              key={b.title}
              href={b.href || "/shop"}
              className={`group relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${b.gradient} ${b.text} shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[150px]`}
            >
              {/* Dot texture + hover shine — gives the flat gradient card some depth/"stylish" polish */}
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "16px 16px" }}
              />
              <span className="shine-sweep" />

              {/* Layered floating emoji cluster instead of one flat icon */}
              <span className="absolute -right-3 -bottom-4 text-8xl opacity-20 select-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                {b.emoji}
              </span>
              <span
                className="absolute right-10 top-4 text-2xl opacity-30 select-none animate-float"
                style={{ animationDuration: "4.5s", animationDelay: `${i * 0.3}s` }}
              >
                {b.emoji}
              </span>

              <div className="relative">
                <h3 className="text-xl font-black leading-tight">{b.title}</h3>
                <p className="text-sm mt-1 opacity-85 max-w-[200px]">{b.body}</p>
              </div>
              <span className="relative inline-flex items-center gap-1.5 text-sm font-bold mt-3 transition-transform duration-300 group-hover:translate-x-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
