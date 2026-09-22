import type { ReactNode } from "react";

export type LegalSection = { title: string; body: ReactNode };

/** Shared shell for the long-form policy pages (Privacy, Terms, Refund/Return, Shipping &
 *  Delivery) so they read as one consistent document style instead of four different layouts. */
export default function LegalPageLayout({
  title,
  lastUpdated,
  intro,
  sections,
  footer,
}: {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-800">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
      {intro && <div className="mt-6 text-slate-700 leading-relaxed space-y-3">{intro}</div>}

      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold text-navy-800 mb-2">{s.title}</h2>
            <div className="text-slate-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-brand-700 [&_a]:font-semibold [&_a]:underline [&_strong]:text-navy-800">
              {s.body}
            </div>
          </section>
        ))}
      </div>

      {footer && <div className="mt-10 pt-8 border-t border-slate-200">{footer}</div>}
    </div>
  );
}
