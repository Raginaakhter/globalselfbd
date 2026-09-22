// GET  /api/wishlist — the signed-in user's saved products (auth required, no guest wishlist).
// POST /api/wishlist — toggle a product in/out of the signed-in user's wishlist.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth-middleware";
import { wishlistToggleSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse || !user) {
    return errorResponse || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const products = items
    .filter((it) => it.product.active)
    .map((it) => ({ ...it.product, highlights: JSON.parse(it.product.highlights) as string[] }));

  return NextResponse.json({
    success: true,
    data: { products, productIds: products.map((p) => p.id) },
  });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateRequest(req);
  if (errorResponse || !user) {
    return errorResponse || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = wishlistToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message || "Invalid product" },
      { status: 400 }
    );
  }
  const { productId } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  }

  const count = await prisma.wishlistItem.count({ where: { userId: user.id } });

  return NextResponse.json({
    success: true,
    message: existing ? "Removed from wishlist" : "Added to wishlist",
    data: { wishlisted: !existing, count },
  });
}
