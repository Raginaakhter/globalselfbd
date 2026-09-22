import { MapPin, Phone, Mail, Globe } from "lucide-react";
import type { SiteSettings } from "@/lib/site-types";

/** The "Global Shelf BD — Address / Phone / Email / Website" block repeated at the bottom of
 *  every policy page. Reads real contact details from site settings instead of hardcoding them
 *  in five different places. */
export default function ContactDetailsBlock({ settings }: { settings: SiteSettings }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 sm:p-6">
      <p className="font-bold text-navy-800 mb-3">{settings.siteName}</p>
      <ul className="space-y-2 text-sm text-slate-700">
        {settings.address && (
          <li className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
            <span>{settings.address}</span>
          </li>
        )}
        {settings.phone && (
          <li className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-brand-600 shrink-0" />
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hover:text-brand-700">
              Phone / WhatsApp: {settings.phone}
            </a>
          </li>
        )}
        {settings.email && (
          <li className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-brand-600 shrink-0" />
            <a href={`mailto:${settings.email}`} className="hover:text-brand-700">{settings.email}</a>
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-brand-600 shrink-0" />
          <span>www.globalshelfbd.com</span>
        </li>
      </ul>
      <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Products. Authentic Choice.</p>
    </div>
  );
}
