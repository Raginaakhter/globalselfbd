// POST /api/orders/track — guest order tracking.
// Verifies that the supplied Order ID and email belong to the same order before returning any
// details. Rate-limited per IP to make brute-forcing Order IDs impractical.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackOrderSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limiter";
import { serializeOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`track-order:${ip}`, 15, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many attempts. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = trackOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Please enter a valid Order ID and email." },
        { status: 400 }
      );
    }

    const { orderId, email } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId.trim().toUpperCase() },
      include: { items: true, statusHistory: true },
    });

    const NOT_FOUND_MESSAGE =
      "We couldn't find an order matching that Order ID and email address. Please double-check and try again.";

    if (!order || !order.customerEmail || order.customerEmail.trim().toLowerCase() !== email) {
      return NextResponse.json({ success: false, message: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error("POST /api/orders/track error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
