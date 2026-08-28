import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

export async function GET(request: NextRequest) {
  await ensureSeeded();
  const email = new URL(request.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  const customer = (await db.select().from(customers).where(eq(customers.email, email.toLowerCase())))[0];
  const history = await db
    .select()
    .from(orders)
    .where(eq(orders.customerEmail, email.toLowerCase()))
    .orderBy(desc(orders.createdAt));
  return NextResponse.json({ customer: customer || null, orders: history });
}
