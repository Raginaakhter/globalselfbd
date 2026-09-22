"use client";

import { Sparkles, Truck, Zap, Bell, ShoppingBag } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const ORBIT_ICONS = [
  { icon: Zap, t: "Lightning checkout", pos: "top-1 left-1/2 -translate-x-1/2" },
  { icon: Truck, t: "Live tracking", pos: "bottom-6 left-0" },
  { icon: Bell, t: "Price-drop alerts", pos: "bottom-6 right-0" },
];

export default function AppPromo() {
  const { stats } = useSite();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 shadow-xl">
        {/* Ambient glow — this section's own palette, distinct from the rest of the page */}
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-light" />
        <div className="absolute -bottom-24 -right-10 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl animate-pulse-light" style={{ animationDelay: "2s" }} />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center p-6 sm:p-10 lg:p-14">
          {/* Copy side */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold tracking-wide backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300" />
              </span>
              We&apos;re building the app
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mt-4">
              Global Shelf BD, <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">right in your pocket</span>
            </h2>
            <p className="text-sm sm:text-base text-blue-100/80 mt-3 max-w-md">
              A faster, app-only way to shop is on the way.
              <span className="block mt-1">খুব শিগগিরই আসছে মোবাইল অ্যাপ — আরও দ্রুত, আরও সহজ।</span>
            </p>

            <ul className="mt-6 flex flex-wrap gap-2.5">
              {ORBIT_ICONS.map(({ icon: Icon, t }, i) => (
                <li
                  key={t}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/8 border border-white/10 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm animate-float"
                  style={{ animationDelay: `${i * 0.4}s`, animationDuration: "4.5s" }}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-300" />
                  {t}
                </li>
              ))}
            </ul>

            {stats.length > 0 && (
              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                {stats.slice(0, 3).map((s) => (
                  <div key={s.label}>
                    <dt className="text-2xl font-black text-white">{s.value}</dt>
                    <dd className="text-[11px] text-blue-200/70 font-medium mt-0.5">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}

            <a
              href="#get-notified"
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-blue-950 bg-white hover:bg-cyan-50 transition-colors shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-blue-700" /> Be first to know when it launches
            </a>
          </div>

          {/* Visual side — an abstract "signal" badge with orbiting feature icons.
              Deliberately not a fake phone screen / mock order card: nothing here is meant
              to look like real account or order data, since the app doesn't exist yet. */}
          <div className="relative flex justify-center lg:justify-end py-6">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              {/* Concentric rings radiating outward from the badge */}
              <span className="absolute inset-0 rounded-full border border-white/10" />
              <span className="absolute inset-6 rounded-full border border-white/10" />
              <span className="absolute inset-12 rounded-full border border-dashed border-white/15 animate-[spin_40s_linear_infinite]" />

              {/* Central app badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[1.75rem] bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-blue-950/40 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-[1.75rem] bg-cyan-300/40 blur-xl -z-10" />
                  <ShoppingBag className="w-10 h-10 sm:w-11 sm:h-11 text-white" />
                </div>
              </div>

              {/* Orbiting feature bubbles */}
              {ORBIT_ICONS.map(({ icon: Icon, t, pos }, i) => (
                <div
                  key={t}
                  className={`absolute ${pos} flex flex-col items-center gap-1.5 animate-float`}
                  style={{ animationDuration: `${5 + i}s`, animationDelay: `${i * 0.5}s` }}
                >
                  <span className="w-11 h-11 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-700" />
                  </span>
                  <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
