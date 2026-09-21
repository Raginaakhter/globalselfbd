import Link from "next/link";
import { Globe } from "lucide-react";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Global Shelf BD home">
      <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 via-brand-600 to-navy-600 shadow-lg shadow-brand-500/30 group-hover:rotate-6 transition-transform duration-300">
        <Globe className="w-5 h-5 text-white" />
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-black tracking-tight ${light ? "text-white" : "text-navy-700"}`}>
          Global Shelf <span className="text-brand-500">BD</span>
        </span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.16em] ${light ? "text-white/60" : "text-slate-500"}`}>
          Authentic • Global • Local
        </span>
      </span>
    </Link>
  );
}
