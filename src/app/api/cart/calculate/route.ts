// POST /api/cart/calculate — server-authoritative price calculation
// Body: { items: [{ id: string, qty: number }], zone?: "dhaka" | "outside" }
// Returns: detailed lines with real prices, subtotal, shipping, total

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";


type CartInput = {
  items: { id: string; qty: number }[];
  zone?: "dhaka" | "outside";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CartInput;
    const { items, zone = "dhaka" } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          lines: [],
          subtotal: 0,
          shipping: 0,
          total: 0,
          itemCount: 0,
        },
      });
    }

    // Validate and cap quantities
    const MAX_QTY = 10;
    const cleanItems = items
      .filter((it) => it.id && typeof it.qty === "number" && it.qty > 0)
      .map((it) => ({ id: it.id, qty: Math.min(Math.max(Math.round(it.qty), 1), MAX_QTY) }));

    if (cleanItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: { lines: [], subtotal: 0, shipping: 0, total: 0, itemCount: 0 },
      });
    }

    // Fetch real prices from DB
    const productIds = cleanItems.map((it) => it.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build detailed lines — only include products that exist and are active
    const lines = cleanItems
      .filter((it) => productMap.has(it.id))
      .map((it) => {
        const p = productMap.get(it.id)!;
        const qty = Math.min(it.qty, p.stock); // cap to available stock
        const lineTotal = p.price * qty;
        return {
          product: {
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            size: p.size,
            price: p.price,
            rrp: p.rrp,
            emoji: p.emoji,
            tint: p.tint,
            image: p.image,
            badge: p.badge,
            rating: p.rating,
            reviews: p.reviews,
            stock: p.stock,
          },
          qty,
          lineTotal,
        };
      });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const {
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      shippingInsideDhaka: SHIPPING_INSIDE_DHAKA,
      shippingOutsideDhaka: SHIPPING_OUTSIDE_DHAKA,
    } = await getSiteSettings();
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : zone === "dhaka"
        ? SHIPPING_INSIDE_DHAKA
        : SHIPPING_OUTSIDE_DHAKA;
    const total = subtotal + shipping;

    // Report any invalid product IDs
    const invalidIds = cleanItems
      .filter((it) => !productMap.has(it.id))
      .map((it) => it.id);

    return NextResponse.json({
      success: true,
      data: {
        lines,
        subtotal,
        shipping,
        total,
        itemCount: lines.reduce((n, l) => n + l.qty, 0),
        ...(invalidIds.length > 0 ? { invalidIds } : {}),
      },
    });
  } catch (error) {
    console.error("POST /api/cart/calculate error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate cart" },
      { status: 500 }
    );
  }
}
