import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "alenna_admin";
export const ADMIN_HEADER = "x-alenna-staff";
const MAX_AGE = 60 * 60 * 12;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "alenna-takanini-admin-session-key";
}

export function adminPin() {
  return process.env.ADMIN_PIN || "4400";
}

export function signAdminToken() {
  const issued = Date.now().toString();
  const sig = createHmac("sha256", secret()).update(issued).digest("hex");
  return `${issued}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null) {
  if (!token) return false;
  const cleaned = token.trim().replace(/^Bearer\s+/i, "");
  const [issued, sig] = cleaned.split(".");
  if (!issued || !sig) return false;
  const expected = createHmac("sha256", secret()).update(issued).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const age = Date.now() - Number(issued);
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE * 1000;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: MAX_AGE,
  };
}

export function applyAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, cookieOptions());
  return response;
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

export function tokenFromRequest(request?: NextRequest) {
  if (!request) return undefined;
  const custom = request.headers.get(ADMIN_HEADER) || request.headers.get("x-admin-token");
  if (custom) return custom.trim();
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (header) return header.replace(/^Bearer\s+/i, "").trim();
  const fromQuery = request.nextUrl.searchParams.get("staff");
  if (fromQuery) return fromQuery.trim();
  return request.cookies.get(ADMIN_COOKIE)?.value;
}

export function requestIsAdmin(request?: NextRequest) {
  return verifyAdminToken(tokenFromRequest(request));
}

export async function isAdminAuthenticated(request?: NextRequest) {
  if (request && requestIsAdmin(request)) return true;
  try {
    const jar = await cookies();
    if (verifyAdminToken(jar.get(ADMIN_COOKIE)?.value)) return true;
  } catch {
    // cookies() can throw outside a request scope
  }
  return false;
}

export function pinMatches(input: string) {
  const expected = adminPin();
  const a = Buffer.from(String(input).padEnd(16, "\0"));
  const b = Buffer.from(expected.padEnd(16, "\0"));
  return a.length === b.length && timingSafeEqual(a, b) && String(input) === expected;
}
