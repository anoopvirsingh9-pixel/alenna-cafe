import { NextRequest, NextResponse } from "next/server";
import { createPaidOrder } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const order = await createPaidOrder({
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      pickupTime: body.pickupTime,
      pickupDate: body.pickupDate,
      items: body.items,
      notes: body.notes,
      promoCode: body.promoCode,
      redeemPoints: Number(body.redeemPoints || 0),
      cardNumber: body.cardNumber,
      cardName: body.cardName,
      expiry: body.expiry,
      cvc: body.cvc,
    });
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 400 },
    );
  }
}
