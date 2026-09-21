"use client";

import { Phone, Truck, ShieldCheck } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { formatPrice } from "@/lib/shop";

export default function TopBar() {
  const { settings, trustBadges } = useSite();
  const authentic = trustBadges.find((b) => /authentic/i.test(b.title));

  return (
    <div className="bg-navy-700 text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 font-medium truncate">
          <Truck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate">
            Free delivery on orders over {formatPrice(settings.freeShippingThreshold)}
            {settings.topBarText && ` — ${settings.topBarText}`}
          </span>
        </p>
        <div className="hidden md:flex items-center gap-5 text-white/80">
          {authentic && (
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> {authentic.title}
            </span>
          )}
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-brand-400" /> {settings.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
