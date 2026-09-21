"use client";

import { Smartphone, QrCode, Bell, Zap, Gift } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function AppPromo() {
  const { stats } = useSite();
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-navy-50 border border-brand-100 shadow-sm">
        <div className="grid lg:grid-cols-2 gap-8 items-center p-6 sm:p-10">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold mb-4">
              <Smartphone className="w-3.5 h-3.5" /> Mobile App — coming soon
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-navy-700 tracking-tight leading-tight">
              Shop smarter with the <span className="text-gradient-brand">Global Shelf BD</span> app
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-lg">
              Exclusive app-only deals, live order tracking and one-tap reordering.
              <span className="block mt-1">অ্যাপে পাবেন এক্সক্লুসিভ অফার ও দ্রুত অর্ডারের সুবিধা।</span>
            </p>
            <ul className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
              {[
                { icon: Zap, t: "Lightning checkout" },
                { icon: Bell, t: "Price-drop alerts" },
                { icon: Gift, t: "App-only rewards" },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-2 font-semibold text-navy-700">
                  <span className="w-8 h-8 rounded-lg bg-white border border-brand-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-600" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="px-5 py-3 rounded-xl bg-navy-700 text-white text-sm font-bold flex items-center gap-2">
                <span className="text-lg">▶</span> Google Play
              </span>
              <span className="px-5 py-3 rounded-xl bg-navy-700 text-white text-sm font-bold flex items-center gap-2">
                <span className="text-lg">⬇</span> App Store
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="hidden sm:flex w-40 h-40 rounded-3xl bg-white border border-slate-200 shadow-lg items-center justify-center">
              <QrCode className="w-28 h-28 text-navy-700" />
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                  <p className="text-xl font-black text-brand-700">{s.value}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
