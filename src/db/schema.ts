import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type CartModifier = {
  group: string;
  option: string;
  price: number;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: CartModifier[];
  notes?: string;
};

export type ModifierOption = {
  label: string;
  price: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  options: ModifierOption[];
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  pickupTime: text("pickup_time").notNull(),
  pickupDate: text("pickup_date").notNull().default(""),
  items: jsonb("items").notNull().$type<OrderItem[]>(),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  promoCode: text("promo_code"),
  loyaltyPointsEarned: integer("loyalty_points_earned").notNull().default(0),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed").notNull().default(0),
  status: text("status").notNull().default("Confirmed"),
  paymentStatus: text("payment_status").notNull().default("paid"),
  paymentRef: text("payment_ref"),
  refundedCents: integer("refunded_cents").notNull().default(0),
  notes: text("notes"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  actor: text("actor").notNull().default("system"),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  destination: text("destination").notNull(),
  channel: text("channel").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  modifiers: jsonb("modifiers").$type<ModifierGroup[]>().notNull().default([]),
  available: boolean("available").notNull().default(true),
  soldOut: boolean("sold_out").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  minCents: integer("min_cents").notNull().default(0),
  active: boolean("active").notNull().default(true),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses"),
  description: text("description"),
  expiresAt: timestamp("expires_at"),
}, (table) => [uniqueIndex("promo_codes_code_idx").on(table.code)]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  points: integer("points").notNull().default(0),
  totalSpentCents: integer("total_spent_cents").notNull().default(0),
  orderCount: integer("order_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("customers_email_idx").on(table.email)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  type: text("type").notNull(),
  destination: text("destination").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  method: text("method").notNull().default("card"),
  last4: text("last4"),
  brand: text("brand"),
  reference: text("reference").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type MenuItemRow = typeof menuItems.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
export type Payment = typeof payments.$inferSelect;
