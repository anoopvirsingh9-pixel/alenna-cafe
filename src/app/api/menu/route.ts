import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { isAdminAuthenticated } from "@/lib/auth";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Accepts 12.5, "12.50", "$12.50", "1,250" etc. Returns cents, or null if invalid.
function toCents(value: unknown): number | null {
  const n = Number(String(value ?? "").replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}


export async function GET(request: NextRequest) {
  await ensureSeeded();
  const staff = await isAdminAuthenticated(request);
  const items = await db.select().from(menuItems).orderBy(asc(menuItems.sortOrder));
  // The public site only sees items the manager marked "visible".
  // The staff dashboard sees everything (including hidden items) so they can be re-enabled.
  const visible = staff ? items : items.filter((item) => item.available !== false);
  return NextResponse.json({
    items: visible.map((item) => ({
      ...item,
      price: item.priceCents / 100,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSeeded();
  const body = await request.json();
  const id = String(body.id || body.name || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const priceCents = toCents(body.price);
  if (priceCents === null) {
    return NextResponse.json({ error: "Price must be a number like 12.50" }, { status: 400 });
  }
  const [item] = await db
    .insert(menuItems)
    .values({
      id: `${id}-${Date.now().toString().slice(-4)}`,
      name: body.name,
      description: body.description || "",
      priceCents,
      category: body.category || "breakfast",
      image: body.image || "https://images.pexels.com/photos/894696/pexels-photo-894696.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      tags: body.tags || [],
      modifiers: body.modifiers || [],
      available: body.available !== false,
      soldOut: Boolean(body.soldOut),
      sortOrder: Number(body.sortOrder || 99),
    })
    .returning();
  return NextResponse.json({ item }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const priceCents = toCents(body.price);
  if (priceCents === null) {
    return NextResponse.json({ error: "Price must be a number like 12.50" }, { status: 400 });
  }
  const [item] = await db
    .update(menuItems)
    .set({
      name: body.name,
      description: body.description,
      priceCents,
      category: body.category,
      image: body.image,
      tags: body.tags || [],
      modifiers: body.modifiers || [],
      available: body.available !== false,
      soldOut: Boolean(body.soldOut),
      sortOrder: Number(body.sortOrder || 0),
    })
    .where(eq(menuItems.id, String(body.id)))
    .returning();
  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(menuItems).where(eq(menuItems.id, id));
  return NextResponse.json({ success: true });
}
