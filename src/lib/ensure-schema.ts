import { pool } from "@/db";

/**
 * Creates every table the cafe needs, IF they don't exist yet.
 * Runs at most once per server instance (and is safe even if it runs again —
 * everything uses IF NOT EXISTS). This lets a fresh Neon database heal itself
 * the first time anybody opens the site — no manual setup step.
 */
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "points" integer DEFAULT 0 NOT NULL,
  "total_spent_cents" integer DEFAULT 0 NOT NULL,
  "order_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price_cents" integer NOT NULL,
  "category" text NOT NULL,
  "image" text NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "modifiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "available" boolean DEFAULT true NOT NULL,
  "sold_out" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer,
  "type" text NOT NULL,
  "destination" text NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "order_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "actor" text DEFAULT 'system' NOT NULL,
  "from_status" text,
  "to_status" text NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "customer_name" text NOT NULL,
  "customer_email" text NOT NULL,
  "customer_phone" text NOT NULL,
  "pickup_time" text NOT NULL,
  "pickup_date" text DEFAULT '' NOT NULL,
  "items" jsonb NOT NULL,
  "subtotal_cents" integer DEFAULT 0 NOT NULL,
  "discount_cents" integer DEFAULT 0 NOT NULL,
  "total_cents" integer NOT NULL,
  "promo_code" text,
  "loyalty_points_earned" integer DEFAULT 0 NOT NULL,
  "loyalty_points_redeemed" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'Confirmed' NOT NULL,
  "payment_status" text DEFAULT 'paid' NOT NULL,
  "payment_ref" text,
  "refunded_cents" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "verified_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "amount_cents" integer NOT NULL,
  "status" text NOT NULL,
  "method" text DEFAULT 'card' NOT NULL,
  "last4" text,
  "brand" text,
  "reference" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "promo_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "type" text NOT NULL,
  "value" integer NOT NULL,
  "min_cents" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "uses" integer DEFAULT 0 NOT NULL,
  "max_uses" integer,
  "description" text,
  "expires_at" timestamp
);
CREATE TABLE IF NOT EXISTS "settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "verification_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "destination" text NOT NULL,
  "channel" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_idx" ON "customers" USING btree ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_idx" ON "promo_codes" USING btree ("code");
`;

let schemaPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await pool.query(SCHEMA_SQL);
    })().catch((err) => {
      // allow a retry on the next request if this attempt failed
      schemaPromise = null;
      throw err;
    }) as Promise<void>;
  }
  return schemaPromise;
}
