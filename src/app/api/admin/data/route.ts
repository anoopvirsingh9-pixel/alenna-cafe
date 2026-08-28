import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { customers, notifications, orderEvents, payments, promoCodes, settings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { isAdminAuthenticated } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { getStoreSettings, listOrders, saveStoreSettings, type StoreSettings } from "@/lib/store";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSeeded();
  const [orderRows, customerRows, promoRows, paymentRows, eventRows, noteRows, store] = await Promise.all([
    listOrders(),
    db.select().from(customers).orderBy(desc(customers.updatedAt)),
    db.select().from(promoCodes),
    db.select().from(payments).orderBy(desc(payments.createdAt)).limit(80),
    db.select().from(orderEvents).orderBy(desc(orderEvents.createdAt)).limit(80),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(80),
    getStoreSettings(),
  ]);
  return NextResponse.json({
    orders: orderRows,
    customers: customerRows,
    promos: promoRows,
    payments: paymentRows,
    events: eventRows,
    notifications: noteRows,
    settings: store,
  });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (body.settings) {
    const next = await saveStoreSettings(body.settings as StoreSettings);
    return NextResponse.json({ settings: next });
  }
  if (body.promo) {
    const [promo] = await db
      .insert(promoCodes)
      .values({
        code: String(body.promo.code).toUpperCase(),
        type: body.promo.type,
        value: Number(body.promo.value),
        minCents: Math.round(Number(body.promo.min || 0) * 100),
        description: body.promo.description || "",
        active: true,
      })
      .returning();
    return NextResponse.json({ promo });
  }
  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
