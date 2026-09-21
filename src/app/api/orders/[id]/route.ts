// GET /api/orders/[id] — fetch order details by ID

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        address: order.address,
        area: order.area,
        zone: order.zone,
        note: order.note,
        payment: order.payment,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((it) => ({
          id: it.productId,
          name: it.name,
          emoji: it.emoji,
          size: it.size,
          price: it.price,
          qty: it.qty,
          lineTotal: it.lineTotal,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
