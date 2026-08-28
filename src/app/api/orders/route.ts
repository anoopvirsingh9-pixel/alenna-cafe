import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listOrders, refundOrder, updateOrderStatus } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  if (id) {
    const order = (await db.select().from(orders).where(eq(orders.id, Number(id))))[0];
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
    const order = await updateOrderStatus(Number(body.id), String(body.status));
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}
