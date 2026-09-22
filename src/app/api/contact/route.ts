// POST /api/contact — public Contact Us form submission.
// Always persists the message to the database first (the source of truth), then makes a
// best-effort attempt to email the store's inbox as a heads-up.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { sanitizeInput } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limiter";
import { sendContactNotificationEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/site";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many messages sent. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Please check the form and try again." },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;

    const saved = await prisma.contactMessage.create({
      data: {
        name: sanitizeInput(name),
        email,
        phone: sanitizeInput(phone || ""),
        subject: sanitizeInput(subject),
        message: message.trim(),
      },
    });

    const { email: storeEmail } = await getSiteSettings();
    sendContactNotificationEmail(storeEmail, { name: saved.name, email: saved.email, phone: saved.phone, subject: saved.subject, message: saved.message }).catch(
      (err) => console.error("Contact notification email failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Thanks for reaching out — our team will get back to you as soon as possible.",
    });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json({ success: false, message: "Failed to send your message. Please try again." }, { status: 500 });
  }
}
