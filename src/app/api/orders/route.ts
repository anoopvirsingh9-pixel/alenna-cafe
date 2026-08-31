import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listOrders, markPaidInStore, refundOrder, updateOrderStatus } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { db } from "@/db";
import { notifications, orderEvents, orders, payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  if (id) {
    // Smart lookup: order number, "#12", ALN-reference, email or phone all work.
    const raw = id.trim().replace(/^#/, "");
    let order: typeof orders.$inferSelect | undefined;

    if (/^\d+$/.test(raw)) {
      order = (await db.select().from(orders).where(eq(orders.id, Number(raw))))[0];
    }
    if (!order && raw.toUpperCase().startsWith("ALN-")) {
      order = (await db.select().from(orders).where(eq(orders.paymentRef, raw.toUpperCase())))[0];
    }
    if (!order && raw.includes("@")) {
      order = (
        await db
          .select()
          .from(orders)
          .where(eq(orders.customerEmail, raw.toLowerCase()))
          .orderBy(desc(orders.createdAt))
          .limit(1)
      )[0];
    }
    if (!order) {
      // phone — compare on digits only so +64 / 021 / spaces all match
      const digits = raw.replace(/\D/g, "").slice(-9);
      if (digits.length >= 7) {
        const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(150);
        order = rows.find((row) => row.customerPhone.replace(/\D/g, "").endsWith(digits));
      }
    }
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  }

  if (email) {
    const history = await db.select().from(orders).where(eq(orders.customerEmail, email.toLowerCase()));
    return NextResponse.json({ orders: history });
  }

  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ orders: await listOrders() });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (body.action === "refund") {
      const order = await refundOrder(Number(body.id), body.amountCents ? Number(body.amountCents) : undefined);
      return NextResponse.json({ success: true, order });
    }
    if (body.action === "paidInStore") {
      const order = await markPaidInStore(Number(body.id));
      return NextResponse.json({ success: true, order });
    }
    const order = await updateOrderStatus(Number(body.id), String(body.status));
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope === "cancelled") {
    // wipe every cancelled order so the board stays clean
    const gone = await db.select({ id: orders.id }).from(orders).where(eq(orders.status, "Cancelled"));
    for (const row of gone) {
      await db.delete(notifications).where(eq(notifications.orderId, row.id));
      await db.delete(orderEvents).where(eq(orderEvents.orderId, row.id));
      await db.delete(payments).where(eq(payments.orderId, row.id));
    }
    await db.delete(orders).where(eq(orders.status, "Cancelled"));
    return NextResponse.json({ success: true, deleted: gone.length });
  }

  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(notifications).where(eq(notifications.orderId, id));
  await db.delete(orderEvents).where(eq(orderEvents.orderId, id));
  await db.delete(payments).where(eq(payments.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
  return NextResponse.json({ success: true, deleted: 1 });
}
