import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import {
  applyAdminCookie,
  clearAdminCookie,
  isAdminAuthenticated,
  pinMatches,
  signAdminToken,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: await isAdminAuthenticated(request) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin || "");
  if (!pinMatches(pin)) {
    return NextResponse.json({ error: "Incorrect access code." }, { status: 401 });
  }
  const token = signAdminToken();
  const response = NextResponse.json({ success: true, token });
  return applyAdminCookie(response, token);
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearAdminCookie(response);
}
