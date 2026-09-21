// GET /api/products/[id] — get a single product by ID

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id, active: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Parse highlights JSON
    const parsed = {
      ...product,
      highlights: JSON.parse(product.highlights) as string[],
    };

    // Fetch related products (same category first, then others)
    const related = await prisma.product.findMany({
      where: {
        active: true,
        id: { not: id },
      },
      orderBy: { reviews: "desc" },
      take: 12,
    });

    // Sort: same category first
    const relatedParsed = related
      .sort((a, b) => {
        const aMatch = a.category === product.category ? 1 : 0;
        const bMatch = b.category === product.category ? 1 : 0;
        return bMatch - aMatch;
      })
      .slice(0, 6)
      .map((p) => ({
        ...p,
        highlights: JSON.parse(p.highlights) as string[],
      }));

    return NextResponse.json({
      success: true,
      data: {
        product: parsed,
        related: relatedParsed,
      },
    });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
