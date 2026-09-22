// GET /api/admin/orders — list/search/filter all orders. Admin only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";
import { serializeOrderSummary } from "@/lib/orders";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAdmin(req);
  if (errorResponse || !user) return errorResponse!;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status")?.trim();
  const q = searchParams.get("q")?.trim();
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);

  const where: Prisma.OrderWhereInput = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
      { customerPhone: { contains: q } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders: orders.map(serializeOrderSummary),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
}
