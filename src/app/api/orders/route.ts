// POST /api/orders — place a new order
// Re-validates all prices server-side. Stores order + line items in DB.
// GET  /api/orders — "My Orders": list of the authenticated user's own orders.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";
import { newOrderId, serializeOrder, serializeOrderSummary } from "@/lib/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { authenticateRequest } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limiter";

const MAX_QTY = 10;

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type OrderInput = {
  items: { id: string; qty: number }[];
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    area: string;
    zone: "dhaka" | "outside";
    note?: string;
  };
  payment?: "cod";
  userId?: string; // optional — set by the frontend if user is logged in
};

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`place-order:${ip}`, 20, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many orders placed. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = (await req.json()) as OrderInput;
    const { items, customer } = body;

    // -------- Only trust a userId that comes from a verified access token --------
    // (a client-supplied `userId` in the body is never trusted for who the order belongs to)
    let verifiedUserId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { user } = await authenticateRequest(req);
      if (user) verifiedUserId = user.id;
    }

    // -------- Validate customer fields --------
    const errors: Record<string, string> = {};
    if (!customer?.name || customer.name.trim().length < 2) {
      errors.name = "Please enter your full name.";
    }
    if (!customer?.phone || !BD_PHONE.test(customer.phone.replace(/[\s-]/g, ""))) {
      errors.phone = "Enter a valid Bangladeshi mobile number.";
    }
    if (!customer?.email || !EMAIL_RE.test(customer.email)) {
      errors.email = "Enter a valid email address — it's used for your order confirmation and order tracking.";
    }
    if (!customer?.address || customer.address.trim().length < 8) {
      errors.address = "Please enter your full delivery address.";
    }
    if (!customer?.area || customer.area.trim().length < 2) {
      errors.area = "Please enter your area / district.";
    }
    if (!customer?.zone || !["dhaka", "outside"].includes(customer.zone)) {
      errors.zone = "Please select a delivery zone.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // -------- Validate items --------
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 }
      );
    }

    const cleanItems = items
      .filter((it) => it.id && typeof it.qty === "number" && it.qty > 0)
      .map((it) => ({ id: it.id, qty: Math.min(Math.max(Math.round(it.qty), 1), MAX_QTY) }));

    if (cleanItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid items in cart" },
        { status: 400 }
      );
    }

    // -------- Fetch real prices from DB --------
    const productIds = cleanItems.map((it) => it.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check for invalid products
    const invalidIds = cleanItems.filter((it) => !productMap.has(it.id)).map((it) => it.id);
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, message: `Products not found: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    // -------- Check stock and compute totals --------
    const orderItems: {
      productId: string;
      name: string;
      emoji: string;
      size: string;
      price: number;
      qty: number;
      lineTotal: number;
    }[] = [];

    for (const item of cleanItems) {
      const p = productMap.get(item.id)!;
      if (item.qty > p.stock) {
        return NextResponse.json(
          { success: false, message: `Only ${p.stock} units of "${p.name}" available` },
          { status: 400 }
        );
      }
      orderItems.push({
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        size: p.size,
        price: p.price,
        qty: item.qty,
        lineTotal: p.price * item.qty,
      });
    }

    const subtotal = orderItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const {
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      shippingInsideDhaka: SHIPPING_INSIDE_DHAKA,
      shippingOutsideDhaka: SHIPPING_OUTSIDE_DHAKA,
    } = await getSiteSettings();
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : customer.zone === "dhaka"
        ? SHIPPING_INSIDE_DHAKA
        : SHIPPING_OUTSIDE_DHAKA;
    const total = subtotal + shipping;

    // -------- Create order + items + initial status history in a transaction --------
    const orderId = newOrderId();

    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock for each product
      for (const item of cleanItems) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Create order
      return tx.order.create({
        data: {
          id: orderId,
          userId: verifiedUserId,
          customerName: customer.name.trim(),
          customerPhone: customer.phone.replace(/[\s-]/g, ""),
          customerEmail: customer.email?.trim().toLowerCase() || "",
          address: customer.address.trim(),
          area: customer.area.trim(),
          zone: customer.zone,
          note: customer.note || "",
          payment: "cod",
          subtotal,
          shipping,
          total,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: { status: "pending", note: "Order placed", changedBy: "system" },
          },
        },
        include: { items: true, statusHistory: true },
      });
    });

    const serialized = serializeOrder(order);

    // Best-effort order confirmation email — never fails the order if SMTP is unavailable.
    if (serialized.customerEmail) {
      sendOrderConfirmationEmail(serialized).catch((err) =>
        console.error("Order confirmation email failed:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      data: serialized,
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order" },
      { status: 500 }
    );
  }
}

// GET /api/orders — "My Orders": every order that belongs to the signed-in user, newest first.
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse || !user) {
    return errorResponse || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: { orders: orders.map(serializeOrderSummary) },
  });
}
