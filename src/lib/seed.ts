import { db } from "@/db";
import { customers, menuItems, promoCodes, settings } from "@/db/schema";
import { defaultPromos, defaultSettings, menuItems as seedMenu } from "@/lib/menu-data";
import { ensureSchema } from "@/lib/ensure-schema";
import { eq } from "drizzle-orm";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  // self-heal: create the tables first if this is a fresh database
  await ensureSchema();
  const existing = await db.select({ id: menuItems.id }).from(menuItems).limit(1);
  if (existing.length === 0) {
    await db.insert(menuItems).values(
      seedMenu.map((item, index) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        priceCents: Math.round(item.price * 100),
        category: item.category,
        image: item.image,
        tags: item.tags || [],
        modifiers: item.modifiers || [],
        available: true,
        soldOut: false,
        sortOrder: index,
      })),
    );
  }

  const promoExisting = await db.select({ id: promoCodes.id }).from(promoCodes).limit(1);
  if (promoExisting.length === 0 && defaultPromos.length > 0) {
    await db.insert(promoCodes).values(
      defaultPromos.map((promo) => ({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        minCents: promo.minCents,
        active: true,
        description: promo.description,
      })),
    );
  }

  const settingExisting = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, "store"));
  if (settingExisting.length === 0) {
    await db.insert(settings).values({ key: "store", value: defaultSettings });
  }

  seeded = true;
}
