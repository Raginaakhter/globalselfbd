// GET /api/orders/[id] — fetch a single order's details.
//
// Authorization: an order's full details (customer info, address, items, status history) are
// only ever returned to either
//   1. the signed-in user who owns the order (Bearer token, order.userId matches), or
//   2. a guest who supplies the exact email address the order was placed with (?email=...),
// so nobody can view another customer's order just by guessing/incrementing an Order ID.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth-middleware";
import { serializeOrder } from "@/lib/orders";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, statusHistory: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // -------- Authorization --------
    let authorized = false;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { user } = await authenticateRequest(req);
      if (user && order.userId && user.id === order.userId) {
        authorized = true;
      }
    }

    if (!authorized) {
      const emailParam = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
      if (emailParam && order.customerEmail && order.customerEmail.trim().toLowerCase() === emailParam) {
        authorized = true;
      }
    }

    if (!authorized) {
      // Generic 404 — don't confirm or deny that an order with this ID exists.
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeOrder(order),
    });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
