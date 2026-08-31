import { createHash, randomInt, randomUUID } from "crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  menuItems,
  notifications,
  orderEvents,
  orders,
  payments,
  promoCodes,
  settings,
  verificationCodes,
  type CartModifier,
  type OrderItem,
} from "@/db/schema";
import { defaultSettings } from "@/lib/menu-data";
import { ensureSeeded } from "@/lib/seed";

export type StoreSettings = typeof defaultSettings;

export function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function getStoreSettings(): Promise<StoreSettings> {
  await ensureSeeded();
  const rows = await db.select().from(settings).where(eq(settings.key, "store"));
  const value = (rows[0]?.value || {}) as Partial<StoreSettings>;
  return { ...defaultSettings, ...value };
}

export async function saveStoreSettings(next: StoreSettings) {
  await db
    .insert(settings)
    .values({ key: "store", value: next, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: next, updatedAt: new Date() },
    });
  return next;
}

export function luhnValid(number: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function cardBrand(number: string) {
  const n = number.replace(/\D/g, "");
  if (n.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "American Express";
  return "Card";
}

export function generatePickupSlots(settingsValue: StoreSettings) {
  // All maths is done in CAFE WALL TIME (Pacific/Auckland), not server time —
  // Vercel runs in UTC, which used to make "today" disappear early.
  const NZ = "Pacific/Auckland";
  const nowNz = new Date(new Date().toLocaleString("en-US", { timeZone: NZ }));
  const minNz = new Date(nowNz.getTime() + settingsValue.minNoticeMinutes * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: NZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = fmt.format(new Date());
  const tomorrowStr = fmt.format(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));

  const slots: { value: string; label: string; date: string }[] = [];
  for (let dayOffset = 0; dayOffset < 2; dayOffset += 1) {
    const day = new Date(nowNz);
    day.setDate(nowNz.getDate() + dayOffset);
    const weekday = day.getDay();
    const openHour = weekday === 0 || weekday === 6 ? 7 : 6;
    const dateStr = dayOffset === 0 ? todayStr : tomorrowStr;

    for (let h = openHour; h < 16; h += 1) {
      for (let m = 0; m < 60; m += settingsValue.slotMinutes) {
        const slot = new Date(day);
        slot.setHours(h, m, 0, 0);
        if (slot < minNz) continue;
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const suffix = h >= 12 ? "PM" : "AM";
        slots.push({
          value: `${hh}:${mm}`,
          date: dateStr,
          label: `${dayOffset === 0 ? "Today" : "Tomorrow"} ${hour12}:${mm} ${suffix}`,
        });
      }
    }
  }
  return slots;
}

export async function slotCount(pickupDate: string, pickupTime: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        eq(orders.pickupDate, pickupDate),
        eq(orders.pickupTime, pickupTime),
        sql`${orders.status} != 'Cancelled'`,
      ),
    );
  return Number(rows[0]?.count || 0);
}

export async function sendVerification(destination: string, channel: "sms" | "email") {
  const cleaned = destination.trim().toLowerCase();
  const recent = await db
    .select()
    .from(verificationCodes)
    .where(and(eq(verificationCodes.destination, cleaned), gte(verificationCodes.createdAt, new Date(Date.now() - 60_000))));
  if (recent.length >= 3) {
    throw new Error("Too many codes requested. Please wait a minute.");
  }

  const code = String(randomInt(100000, 999999));
  await db.insert(verificationCodes).values({
    destination: cleaned,
    channel,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await db.insert(notifications).values({
    type: channel === "sms" ? "sms_verify" : "email_verify",
    destination: cleaned,
    subject: "Your Alenna Cafe verification code",
    message: `Alenna Cafe Takanini: your pickup verification code is ${code}. It expires in 10 minutes.`,
  });

  return code;
}

export async function checkVerification(destination: string, code: string) {
  const cleaned = destination.trim().toLowerCase();
  const rows = await db
    .select()
    .from(verificationCodes)
    .where(eq(verificationCodes.destination, cleaned))
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "No code has been sent yet." };
  if (row.usedAt) return { ok: false, error: "That code has already been used." };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, error: "That code has expired." };
  if (row.attempts >= 5) return { ok: false, error: "Too many attempts. Request a new code." };

  await db
    .update(verificationCodes)
    .set({ attempts: row.attempts + 1 })
    .where(eq(verificationCodes.id, row.id));

  if (row.codeHash !== hashCode(code.trim())) {
    return { ok: false, error: "Incorrect verification code." };
  }

  await db.update(verificationCodes).set({ usedAt: new Date() }).where(eq(verificationCodes.id, row.id));
  return { ok: true };
}

export async function applyPromo(code: string, subtotalCents: number) {
  const promo = (
    await db.select().from(promoCodes).where(eq(promoCodes.code, code.trim().toUpperCase()))
  )[0];
  if (!promo || !promo.active) return { error: "Promo code is not valid." };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return { error: "Promo code has expired." };
  if (promo.maxUses !== null && promo.uses >= (promo.maxUses || 0)) return { error: "Promo code has been fully used." };
  if (subtotalCents < promo.minCents) {
    return { error: `Spend $${(promo.minCents / 100).toFixed(2)} to use this code.` };
  }
  const discount = promo.type === "percent"
    ? Math.round(subtotalCents * (promo.value / 100))
    : promo.value;
  return { promo, discountCents: Math.min(discount, subtotalCents) };
}

export function priceCartItems(
  catalog: { id: string; name: string; priceCents: number; soldOut: boolean; available: boolean; modifiers: { id: string; name: string; required: boolean; options: { label: string; price: number }[] }[] }[],
  rawItems: OrderItem[],
) {
  const priced: OrderItem[] = [];
  for (const item of rawItems) {
    const product = catalog.find((row) => row.id === item.menuItemId || row.id === item.id);
    if (!product) throw new Error(`Unknown menu item: ${item.name}`);
    if (product.soldOut || !product.available) throw new Error(`${product.name} is currently unavailable.`);
    const modifiers: CartModifier[] = (item.modifiers || []).map((mod) => {
      const group = product.modifiers.find((g) => g.name === mod.group || g.id === mod.group);
      const option = group?.options.find((o) => o.label === mod.option);
      return {
        group: group?.name || mod.group,
        option: option?.label || mod.option,
        price: option ? option.price : 0,
      };
    });
    const modifierTotal = modifiers.reduce((sum, mod) => sum + mod.price, 0);
    const unit = product.priceCents / 100 + modifierTotal;
    priced.push({
      id: item.id || `${product.id}-${randomUUID()}`,
      menuItemId: product.id,
      name: product.name,
      price: Number(unit.toFixed(2)),
      quantity: item.quantity,
      modifiers,
      notes: item.notes,
    });
  }
  return priced;
}

export async function upsertCustomer(name: string, email: string, phone: string, spentCents: number, pointsDelta: number) {
  const existing = (await db.select().from(customers).where(eq(customers.email, email.toLowerCase())))[0];
  if (!existing) {
    const [created] = await db
      .insert(customers)
      .values({
        name,
        email: email.toLowerCase(),
        phone,
        points: Math.max(0, pointsDelta),
        totalSpentCents: spentCents,
        orderCount: 1,
      })
      .returning();
    return created;
  }
  const [updated] = await db
    .update(customers)
    .set({
      name,
      phone,
      points: Math.max(0, existing.points + pointsDelta),
      totalSpentCents: existing.totalSpentCents + spentCents,
      orderCount: existing.orderCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, existing.id))
    .returning();
  return updated;
}

export async function recordNotification(orderId: number | null, type: string, destination: string, subject: string, message: string) {
  await db.insert(notifications).values({ orderId, type, destination, subject, message });
}

export async function createPaidOrder(input: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupTime: string;
  pickupDate: string;
  items: OrderItem[];
  notes?: string | null;
  promoCode?: string | null;
  redeemPoints?: number;
  method?: "card" | "instore";
  cardNumber?: string;
  cardName?: string;
  expiry?: string;
  cvc?: string;
}) {
  if (!input.customerName?.trim() || !input.customerEmail?.includes("@") || !input.customerPhone?.trim()) {
    throw new Error("Name, email and phone are required.");
  }
  if (!input.pickupTime || !input.pickupDate) throw new Error("Choose a pickup slot.");
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("Your cart is empty.");

  await ensureSeeded();
  const store = await getStoreSettings();
  if (!store.orderingEnabled) throw new Error("Online ordering is paused. Please call the cafe.");

  const catalog = await db.select().from(menuItems);
  const items = priceCartItems(catalog, input.items);
  if (items.length === 0) throw new Error("Your cart is empty.");

  const subtotalCents = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100);
  let discountCents = 0;
  let promoUsed: string | null = null;
  if (input.promoCode) {
    const applied = await applyPromo(input.promoCode, subtotalCents);
    if ("error" in applied && applied.error) throw new Error(applied.error);
    if ("discountCents" in applied && typeof applied.discountCents === "number") {
      discountCents += applied.discountCents;
      promoUsed = applied.promo?.code || input.promoCode.toUpperCase();
    }
  }

  const redeem = Math.max(0, Math.min(input.redeemPoints || 0, 500));
  const redeemValueCents = redeem * store.loyaltyRedeemValue;
  discountCents += redeemValueCents;
  discountCents = Math.min(discountCents, subtotalCents);
  const totalCents = subtotalCents - discountCents;
  if (totalCents < 50) throw new Error("Order total is too small after discounts.");

  const taken = await slotCount(input.pickupDate, input.pickupTime);
  if (taken >= store.maxOrdersPerSlot) {
    throw new Error("That pickup time is fully booked. Please choose another slot.");
  }

  const payInStore = input.method === "instore";
  let card = "";
  if (!payInStore) {
    card = String(input.cardNumber || "").replace(/\s+/g, "");
    if (!luhnValid(card)) throw new Error("Card number is invalid.");
    if (!/^\d{2}\/\d{2}$/.test(String(input.expiry || ""))) throw new Error("Expiry must be MM/YY.");
    const [mm, yy] = String(input.expiry).split("/").map(Number);
    const exp = new Date(2000 + yy, mm, 0);
    if (mm < 1 || mm > 12 || exp < new Date()) throw new Error("Card is expired.");
    if (!/^\d{3,4}$/.test(String(input.cvc || ""))) throw new Error("CVC is invalid.");
    if (String(input.cardName || "").trim().length < 2) throw new Error("Cardholder name is required.");
  }

  const reference = `ALN-${randomUUID().slice(0, 8).toUpperCase()}`;
  const pointsEarned = Math.floor(totalCents / store.loyaltySpendPerPoint);

  const [order] = await db
    .insert(orders)
    .values({
      customerName: input.customerName,
      customerEmail: input.customerEmail.toLowerCase(),
      customerPhone: input.customerPhone,
      pickupTime: input.pickupTime,
      pickupDate: input.pickupDate,
      items,
      subtotalCents,
      discountCents,
      totalCents,
      promoCode: promoUsed,
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: redeem,
      status: "Confirmed",
      paymentStatus: payInStore ? "pay on pickup" : "paid",
      paymentRef: reference,
      notes: input.notes || null,
      verifiedAt: new Date(),
    })
    .returning();

  await db.insert(payments).values({
    orderId: order.id,
    amountCents: totalCents,
    status: payInStore ? "pending" : "captured",
    method: payInStore ? "instore" : "card",
    last4: card ? card.slice(-4) : null,
    brand: card ? cardBrand(card) : null,
    reference,
  });

  if (promoUsed) {
    await db
      .update(promoCodes)
      .set({ uses: sql`${promoCodes.uses} + 1` })
      .where(eq(promoCodes.code, promoUsed));
  }

  await upsertCustomer(
    input.customerName,
    input.customerEmail,
    input.customerPhone,
    totalCents,
    pointsEarned - redeem,
  );

  await db.insert(orderEvents).values({
    orderId: order.id,
    actor: "customer",
    toStatus: "Confirmed",
    note: payInStore ? `Pay on pickup ${reference}` : `Paid ${reference}`,
  });

  await recordNotification(
    order.id,
    "email_receipt",
    input.customerEmail,
    `Alenna Cafe order #${order.id} confirmed`,
    payInStore
      ? `Kia ora ${input.customerName}, your order #${order.id} is confirmed for pickup at ${input.pickupTime} on ${input.pickupDate}. Total to pay at the counter: $${(totalCents / 100).toFixed(2)}. Reference ${reference}.`
      : `Kia ora ${input.customerName}, your order #${order.id} is confirmed for pickup at ${input.pickupTime} on ${input.pickupDate}. Total paid: $${(totalCents / 100).toFixed(2)}. Reference ${reference}.`,
  );
  await recordNotification(
    order.id,
    "sms_receipt",
    input.customerPhone,
    "Order confirmed",
    payInStore
      ? `Alenna Cafe: order #${order.id} confirmed. Pay $${(totalCents / 100).toFixed(2)} at pickup ${input.pickupTime}. Show this message at the counter.`
      : `Alenna Cafe: order #${order.id} paid. Pickup ${input.pickupTime}. Show this message at the counter.`,
  );

  return order;
}

export async function listOrders() {
  await ensureSeeded();
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(150);
}

/** Staff confirmed the customer paid at the counter — mark the order fully paid. */
export async function markPaidInStore(orderId: number) {
  await ensureSeeded();
  const [order] = await db
    .update(orders)
    .set({ paymentStatus: "paid", status: "Completed", updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  if (!order) throw new Error("Order not found");
  await db.update(payments).set({ status: "captured" }).where(eq(payments.orderId, orderId));
  await db.insert(orderEvents).values({
    orderId,
    actor: "staff",
    toStatus: "Completed",
    note: "Paid at counter",
  });
  return order;
}

export async function updateOrderStatus(id: number, status: string, actor = "staff") {
  const current = (await db.select().from(orders).where(eq(orders.id, id)))[0];
  if (!current) throw new Error("Order not found");
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  await db.insert(orderEvents).values({
    orderId: id,
    actor,
    fromStatus: current.status,
    toStatus: status,
    note: `Status changed to ${status}`,
  });

  if (status === "Ready for Pickup") {
    await recordNotification(
      id,
      "sms_ready",
      current.customerPhone,
      "Order ready",
      `Alenna Cafe: order #${id} is ready for pickup at 9/226 Great South Road, Takanini.`,
    );
  }
  if (status === "Cancelled") {
    await recordNotification(
      id,
      "email_cancel",
      current.customerEmail,
      `Order #${id} cancelled`,
      `Your Alenna Cafe order #${id} was cancelled. If you already paid at the counter, the cafe will sort it out — just ask.`,
    );
  }
  return updated;
}

export async function refundOrder(id: number, amountCents?: number) {
  const current = (await db.select().from(orders).where(eq(orders.id, id)))[0];
  if (!current) throw new Error("Order not found");
  const remaining = current.totalCents - current.refundedCents;
  const refund = Math.min(amountCents || remaining, remaining);
  if (refund <= 0) throw new Error("Nothing left to refund.");
  const fully = current.refundedCents + refund >= current.totalCents;
  const [updated] = await db
    .update(orders)
    .set({
      refundedCents: current.refundedCents + refund,
      paymentStatus: fully ? "refunded" : "partial_refund",
      status: fully ? "Cancelled" : current.status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id))
    .returning();
  await db.insert(payments).values({
    orderId: id,
    amountCents: -refund,
    status: "refunded",
    method: "card",
    reference: `${current.paymentRef || "ALN"}-RFND`,
  });
  await db.insert(orderEvents).values({
    orderId: id,
    actor: "staff",
    fromStatus: current.status,
    toStatus: updated.status,
    note: `Refunded $${(refund / 100).toFixed(2)}`,
  });
  await recordNotification(
    id,
    "email_refund",
    current.customerEmail,
    `Refund for order #${id}`,
    `A refund of $${(refund / 100).toFixed(2)} has been issued for Alenna Cafe order #${id}.`,
  );
  return updated;
}
