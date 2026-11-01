import { NextResponse } from "next/server";
import { generatePickupSlots, getStoreSettings, slotCount } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const settings = await getStoreSettings();
  const slots = generatePickupSlots(settings);
  const withCapacity = await Promise.all(
    slots.slice(0, 36).map(async (slot) => {
      const used = await slotCount(slot.date, slot.value);
      return { ...slot, used, remaining: Math.max(0, settings.maxOrdersPerSlot - used) };
    }),
  );
  return NextResponse.json({
    orderingEnabled: settings.orderingEnabled,
    gstIncluded: settings.gstIncluded,
    cardFee: {
      enabled: settings.cardFeeEnabled !== false,
      percent: Number(settings.cardFeePercent ?? 2.65),
      fixedCents: Number(settings.cardFeeFixedCents ?? 30),
    },
    slots: withCapacity.filter((slot) => slot.remaining > 0),
  });
}
