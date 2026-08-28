import { NextRequest, NextResponse } from "next/server";
import { applyPromo } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";

export async function POST(request: NextRequest) {
  await ensureSeeded();
  const body = await request.json();
  const result = await applyPromo(String(body.code || ""), Number(body.subtotalCents || 0));
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
