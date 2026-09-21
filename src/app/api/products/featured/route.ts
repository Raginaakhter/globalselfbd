// GET /api/products/featured — returns grouped products for the landing page
// Returns: bestSellers, topDeals, newArrivals

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseHighlights(p: { highlights: string; [key: string]: unknown }) {
  return { ...p, highlights: JSON.parse(p.highlights) as string[] };
}

export async function GET() {
  try {
    const [bestSellers, topDeals, newArrivals] = await Promise.all([
      prisma.product.findMany({
        where: { active: true, group: "best-sellers" },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { active: true, group: "top-deals" },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { active: true, group: "new-arrivals" },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bestSellers: bestSellers.map(parseHighlights),
        topDeals: topDeals.map(parseHighlights),
        newArrivals: newArrivals.map(parseHighlights),
      },
    });
  } catch (error) {
    console.error("GET /api/products/featured error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}
