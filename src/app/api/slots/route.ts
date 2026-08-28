import { NextResponse } from "next/server";
import { generatePickupSlots, getStoreSettings, slotCount } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";

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
    slots: withCapacity.filter((slot) => slot.remaining > 0),
  });
}
