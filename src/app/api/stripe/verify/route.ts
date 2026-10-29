import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, menuItems, notifications, orderEvents, orders, payments, promoCodes } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getStoreSettings } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Called by the success page after Stripe redirects back.
 * Double-checks with Stripe (never trusts the browser) and marks the order paid.
 */
export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = Number(session.client_reference_id || session.metadata?.orderId);
    if (!orderId) return NextResponse.json({ error: "Order not found for this payment." }, { status: 404 });

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (session.payment_status === "paid" && order.paymentStatus !== "paid") {
      await markOrderPaid(orderId);
    }

    const [fresh] = await db.select().from(orders).where(eq(orders.id, orderId));
    return NextResponse.json({
      order: fresh
        ? { id: fresh.id, totalCents: fresh.totalCents, status: fresh.status, paymentStatus: fresh.paymentStatus, pickupDate: fresh.pickupDate, pickupTime: fresh.pickupTime, customerName: fresh.customerName, items: fresh.items, paymentRef: fresh.paymentRef }
        : null,
      paid: session.payment_status === "paid",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify payment." },
      { status: 400 },
    );
  }
}

/** Shared by the verify route and the webhook — marks an order fully paid. */
export async function markOrderPaid(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return;

  const store = await getStoreSettings();
  const pointsEarned = Math.floor(order.totalCents / store.loyaltySpendPerPoint);

  await db
    .update(orders)
    .set({ paymentStatus: "paid", status: "Completed", verifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await db.insert(payments).values({
    orderId,
    amountCents: order.totalCents,
    status: "captured",
    method: "card",
    reference: order.paymentRef || `ALN-${orderId}`,
  });

  if (order.promoCode) {
    await db
      .update(promoCodes)
      .set({ uses: sql`${promoCodes.uses} + 1` })
      .where(eq(promoCodes.code, order.promoCode));
  }

  await db
    .insert(customers)
    .values({
      email: order.customerEmail,
      name: order.customerName,
      phone: order.customerPhone,
      points: pointsEarned,
      totalSpentCents: order.totalCents,
      orderCount: 1,
    })
    .onConflictDoUpdate({
      target: customers.email,
      set: {
        points: sql`${customers.points} + ${pointsEarned}`,
        totalSpentCents: sql`${customers.totalSpentCents} + ${order.totalCents}`,
        orderCount: sql`${customers.orderCount} + 1`,
        updatedAt: new Date(),
      },
    });

  await db.insert(orderEvents).values({
    orderId,
    actor: "stripe",
    toStatus: "Completed",
    note: `Paid online ${order.paymentRef}`,
  });

  await db.insert(notifications).values({
    orderId,
    type: "email_receipt",
    destination: order.customerEmail,
    subject: `Alenna Cafe order #${orderId} paid`,
    message: `Kia ora ${order.customerName}, your order #${orderId} is paid and confirmed for pickup at ${order.pickupTime} on ${order.pickupDate}. Total paid: $${(order.totalCents / 100).toFixed(2)}. Reference ${order.paymentRef}.`,
  });
}
