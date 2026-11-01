import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems, orderEvents, orders } from "@/db/schema";
import { getStoreSettings, priceCartItems, slotCount, applyPromo } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { validateEmail, validatePhone } from "@/lib/validate";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Creates the order (awaiting payment) and a Stripe Checkout Session,
 * then returns the URL the customer is redirected to in order to pay by card.
 * All pricing is recalculated server-side — the browser can't tamper with it.
 */
export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Card payments are almost ready — the cafe is finishing the payment setup. Please try again soon." },
        { status: 503 },
      );
    }

    const body = await request.json();

    if (!body.customerName || String(body.customerName).trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    const emailCheck = validateEmail(body.customerEmail);
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    const phoneCheck = validatePhone(body.customerPhone);
    if (!phoneCheck.ok) return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    if (!body.pickupTime || !body.pickupDate) {
      return NextResponse.json({ error: "Choose a pickup slot." }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const store = await getStoreSettings();
    if (!store.orderingEnabled) {
      return NextResponse.json({ error: "Online ordering is paused. Please call the cafe." }, { status: 400 });
    }

    const catalog = await db.select().from(menuItems);
    const items = priceCartItems(catalog, body.items);
    if (items.length === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

    const subtotalCents = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100);
    let discountCents = 0;
    let promoUsed: string | null = null;
    if (body.promoCode) {
      const applied = await applyPromo(String(body.promoCode), subtotalCents);
      if ("error" in applied && applied.error) {
        return NextResponse.json({ error: applied.error }, { status: 400 });
      }
      if ("discountCents" in applied && typeof applied.discountCents === "number") {
        discountCents += applied.discountCents;
        promoUsed = applied.promo?.code || String(body.promoCode).toUpperCase();
      }
    }
    discountCents = Math.min(discountCents, subtotalCents);
    const totalCents = subtotalCents - discountCents;
    if (totalCents < 50) {
      return NextResponse.json({ error: "Order total is too small after discounts." }, { status: 400 });
    }

    // card surcharge (transparent, shown before payment): passes Stripe's
    // processing cost to the card payer so the cafe nets the menu price
    const cardFeeEnabled = store.cardFeeEnabled !== false;
    const cardFeeCents = cardFeeEnabled
      ? Math.round((totalCents * Number(store.cardFeePercent ?? 2.65)) / 100) + Number(store.cardFeeFixedCents ?? 30)
      : 0;
    const chargeCents = totalCents + cardFeeCents;

    const taken = await slotCount(body.pickupDate, body.pickupTime);
    if (taken >= store.maxOrdersPerSlot) {
      return NextResponse.json({ error: "That pickup time is fully booked. Please choose another slot." }, { status: 400 });
    }

    const reference = `ALN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const [order] = await db
      .insert(orders)
      .values({
        customerName: String(body.customerName).trim(),
        customerEmail: emailCheck.email,
        customerPhone: phoneCheck.phone,
        pickupTime: body.pickupTime,
        pickupDate: body.pickupDate,
        items,
        subtotalCents,
        discountCents,
        totalCents,
        cardFeeCents,
        promoCode: promoUsed,
        status: "Confirmed",
        paymentStatus: "awaiting payment",
        paymentRef: reference,
        notes: body.notes || null,
      })
      .returning();

    await db.insert(orderEvents).values({
      orderId: order.id,
      actor: "customer",
      toStatus: "Confirmed",
      note: `Card checkout started ${reference}`,
    });

    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: emailCheck.email,
      client_reference_id: String(order.id),
      metadata: { orderId: String(order.id) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "nzd",
            unit_amount: chargeCents,
            product_data: {
              name: `Alenna Cafe order #${order.id}`,
              description:
                items.map((i) => `${i.quantity}x ${i.name}`).join(", ").slice(0, 300) || "Cafe pickup order",
            },
          },
        },
      ],
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url, orderId: order.id, chargeCents, cardFeeCents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start card payment." },
      { status: 400 },
    );
  }
}
