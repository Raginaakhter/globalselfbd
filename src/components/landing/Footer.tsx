"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { useSite } from "@/context/SiteContext";

export default function Footer() {
  const { settings, footerColumns } = useSite();
  const { email, phone, whatsapp, address, socials, tagline, complaintTitle, complaintNote } = settings;

  return (
    <footer id="contact" className="mt-16 bg-navy-800 text-white scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)_1.1fr]">
          <div>
            <Logo light />
            {tagline && <p className="text-sm text-white/65 leading-relaxed mt-4 max-w-xs">{tagline}</p>}
            {(socials.length > 0 || whatsapp) && (
              <div className="flex gap-2.5 mt-5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-600 flex items-center justify-center text-xs font-black transition-colors"
                  >
                    {s.label[0]}
                  </a>
                ))}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-600 flex items-center justify-center transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-400 mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/70 hover:text-white hover:translate-x-0.5 inline-block transition-all">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-400 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
                </li>
              )}
              {phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">{phone}</a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
            {(complaintTitle || complaintNote) && (
              <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                {complaintTitle && <p className="text-sm font-bold">{complaintTitle}</p>}
                {complaintNote && <p className="text-xs text-white/60 mt-1">{complaintNote}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>&copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-white">Refund Policy</Link>
            <Link href="/shipping-policy" className="hover:text-white">Shipping Policy</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
