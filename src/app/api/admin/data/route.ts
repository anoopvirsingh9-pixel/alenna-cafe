import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/db";
import { customers, notifications, orderEvents, payments, promoCodes, settings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
    const code = String(body.promo.code || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Enter a promo code (like WINTER5)." }, { status: 400 });
    }
    const value = Number(body.promo.value);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Value must be a number bigger than 0." }, { status: 400 });
    }
    const existing = await db.select({ id: promoCodes.id, active: promoCodes.active }).from(promoCodes).where(eq(promoCodes.code, code));
    if (existing.length > 0) {
      return NextResponse.json({ error: `Promo code ${code} already exists — pick a different code.` }, { status: 400 });
    }
    const [promo] = await db
      .insert(promoCodes)
      .values({
        code,
        type: body.promo.type === "fixed" ? "fixed" : "percent",
        value: Math.round(value),
        minCents: Math.round(Number(body.promo.min || 0) * 100),
        description: body.promo.description || "",
        active: true,
      })
      .returning();
    return NextResponse.json({ promo });
  }
  if (body.promoToggle && body.promoToggle.id) {
    const [promo] = await db
      .update(promoCodes)
      .set({ active: Boolean(body.promoToggle.active) })
      .where(eq(promoCodes.id, Number(body.promoToggle.id)))
      .returning();
    return NextResponse.json({ promo });
  }
  if (body.promoDelete && body.promoDelete.id) {
    await db.delete(promoCodes).where(eq(promoCodes.id, Number(body.promoDelete.id)));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
