import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the reliable "money actually moved" signal.
 * Point a webhook endpoint at /api/stripe/webhook (checkout.session.completed)
 * and set STRIPE_WEBHOOK_SECRET in hosting. Works without it too (skips
 * signature check) but the secret is strongly recommended for production.
 */
export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") || "";
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (secret) {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
    } else {
      event = JSON.parse(payload);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { client_reference_id?: string; payment_status?: string };
      const orderId = Number(session.client_reference_id);
      if (orderId && session.payment_status === "paid") {
        const { markOrderPaid } = await import("@/app/api/stripe/verify/route");
        await markOrderPaid(orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed." },
      { status: 400 },
    );
  }
}
