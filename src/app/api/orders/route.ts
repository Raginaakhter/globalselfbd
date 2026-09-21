// POST /api/orders — place a new order
// Re-validates all prices server-side. Stores order + line items in DB.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";

const MAX_QTY = 10;

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GS-${stamp}${rand}`;
}

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
    const body = (await req.json()) as OrderInput;
    const { items, customer, userId } = body;

    // -------- Validate customer fields --------
    const errors: Record<string, string> = {};
    if (!customer?.name || customer.name.trim().length < 2) {
      errors.name = "Please enter your full name.";
    }
    if (!customer?.phone || !BD_PHONE.test(customer.phone.replace(/[\s-]/g, ""))) {
      errors.phone = "Enter a valid Bangladeshi mobile number.";
    }
    if (customer?.email && !EMAIL_RE.test(customer.email)) {
      errors.email = "Enter a valid email address.";
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

    // -------- Create order + items in a transaction --------
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
          userId: userId || null,
          customerName: customer.name.trim(),
          customerPhone: customer.phone.replace(/[\s-]/g, ""),
          customerEmail: customer.email || "",
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
        },
        include: { items: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      data: {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        items: order.items,
      },
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order" },
      { status: 500 }
    );
  }
}
