// GET /api/products — list products with optional filters
// Query params: category, q (search), sort, limit, offset

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") ?? "";
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const sort = searchParams.get("sort") ?? "popular";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

    // Build where clause
    const where: Prisma.ProductWhereInput = { active: true };
    if (category) {
      where.category = category;
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { category: { contains: q } },
      ];
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (sort) {
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "new":
        orderBy = { createdAt: "desc" };
        break;
      case "discount":
        // Sort by rrp existence + discount magnitude in application logic
        orderBy = { reviews: "desc" };
        break;
      case "popular":
      default:
        orderBy = { reviews: "desc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    // Post-process: parse highlights JSON, sort by discount if needed
    let result = products.map((p) => ({
      ...p,
      highlights: JSON.parse(p.highlights) as string[],
    }));

    if (sort === "discount") {
      result.sort((a, b) => {
        const discA = a.rrp && a.rrp > a.price ? Math.round(((a.rrp - a.price) / a.rrp) * 100) : 0;
        const discB = b.rrp && b.rrp > b.price ? Math.round(((b.rrp - b.price) / b.rrp) * 100) : 0;
        return discB - discA;
      });
    }

    if (sort === "new") {
      // Prioritize products with "NEW" badge
      result.sort((a, b) => Number(b.badge === "NEW") - Number(a.badge === "NEW"));
    }

    return NextResponse.json({
      success: true,
      data: {
        products: result,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
