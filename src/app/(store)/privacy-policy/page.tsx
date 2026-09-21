import type { Metadata } from "next";
import Link from "next/link";
import { fetchSite } from "@/lib/site-fetch";
import type { SiteSettings } from "@/lib/site-types";

export const metadata: Metadata = {
  title: "Privacy Policy | Global Shelf BD",
  description: "How Global Shelf BD collects, uses and protects your personal information.",
};

const LAST_UPDATED = "September 21, 2026";

const buildSections = (settings: SiteSettings): { title: string; body: React.ReactNode }[] => [
  {
    title: "1. Information We Collect",
    body: (
      <>
        <p>We collect only what we need to run the store:</p>
        <ul>
          <li><strong>Account details:</strong> your name, email address, and a securely hashed password (we never store your password in plain text). If you sign in with Google, we receive your name, email and profile picture from Google.</li>
          <li><strong>Order details:</strong> your name, phone number, email (optional), delivery address, area, order note, and the items you order.</li>
          <li><strong>Technical data:</strong> IP address and browser/device information used to keep your session secure and prevent abuse.</li>
        </ul>
      </>
    ),
  },
  {
    title: "2. How We Use Your Information",
    body: (
      <ul>
        <li>To process, deliver and support your orders.</li>
        <li>To create and secure your account, including password-reset codes sent by email.</li>
        <li>To contact you about your order or respond to your messages.</li>
        <li>To detect fraud and protect the security of our website.</li>
      </ul>
    ),
  },
  {
    title: "3. Cookies & Sessions",
    body: (
      <p>
        We use a secure, HTTP-only cookie to keep you signed in. It is used only for authentication and is removed when you sign out.
        We store your shopping cart in your browser so it is still there when you come back.
      </p>
    ),
  },
  {
    title: "4. Sharing Your Information",
    body: (
      <>
        <p>We do not sell your personal information. We share it only when necessary:</p>
        <ul>
          <li>With delivery and courier partners, so your order reaches you.</li>
          <li>With service providers we rely on (for example, email delivery and Google sign-in).</li>
          <li>When required by law or to protect our rights.</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Data Security",
    body: (
      <p>
        Passwords are hashed, sessions use signed tokens, and access to your data requires authentication.
        No method of transmission or storage is completely secure, but we work to protect your information.
      </p>
    ),
  },
  {
    title: "6. Your Rights",
    body: (
      <p>
        You can view and update your name and profile picture from your <Link href="/profile">profile page</Link> at any time.
        You may also ask us to correct or delete your personal data by contacting us below.
      </p>
    ),
  },
  {
    title: "7. Children's Privacy",
    body: <p>Our store is not directed at children under 13, and we do not knowingly collect their personal information.</p>,
  },
  {
    title: "8. Changes to This Policy",
    body: <p>We may update this policy from time to time. The &quot;Last updated&quot; date above shows when it last changed.</p>,
  },
  {
    title: "9. Contact Us",
    body: (
      <p>
        Questions about this policy?{" "}
        {settings.email ? (
          <>Email us at <a href={`mailto:${settings.email}`}>{settings.email}</a></>
        ) : (
          "Contact us through the store."
        )}
        {settings.phone && (
          <> or call <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a></>
        )}
        {settings.email ? "." : ""}
      </p>
    ),
  },
];

export default async function PrivacyPolicyPage() {
  const { settings } = await fetchSite();
  const sections = buildSections(settings);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-navy-800">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      <p className="mt-6 text-slate-700 leading-relaxed">
        Global Shelf BD (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what information we collect
        when you use our website, how we use it, and the choices you have.
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold text-navy-800 mb-2">{s.title}</h2>
            <div className="text-slate-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-brand-700 [&_a]:font-semibold [&_a]:underline">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
