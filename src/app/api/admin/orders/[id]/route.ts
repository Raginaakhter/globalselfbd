// GET   /api/admin/orders/[id] — full order detail, admin only, no ownership restriction.
// PATCH /api/admin/orders/[id] — update order status. Records a status history entry and emails
//                                  the customer. The change is immediately visible to the
//                                  customer on both the profile "My Orders" page and the guest
//                                  tracking page since both read the same Order/OrderStatusHistory rows.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";
import { serializeOrder } from "@/lib/orders";
import { updateOrderStatusSchema } from "@/lib/validation";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { orderStatusLabel } from "@/lib/order-status";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAdmin(req);
  if (errorResponse || !user) return errorResponse!;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, statusHistory: true },
  });

  if (!order) {
    return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: serializeOrder(order) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAdmin(req);
  if (errorResponse || !user) return errorResponse!;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message || "Invalid status" },
      { status: 400 }
    );
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
  }

  const { status, note } = parsed.data;

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          note: note || `Status changed to ${orderStatusLabel(status)} by admin`,
          changedBy: user.email,
        },
      },
    },
    include: { items: true, statusHistory: true },
  });

  const serialized = serializeOrder(order);

  if (existing.status !== status && serialized.customerEmail) {
    sendOrderStatusUpdateEmail(serialized).catch((err) =>
      console.error("Order status update email failed:", err)
    );
  }

  return NextResponse.json({
    success: true,
    message: `Order status updated to "${orderStatusLabel(status)}"`,
    data: serialized,
  });
}
