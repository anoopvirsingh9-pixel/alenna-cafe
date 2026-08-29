import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

// Diagnostic endpoint: shows safe info only (never the password).
function safeInfo() {
  const raw = (process.env.DATABASE_URL || "").trim();
  if (!raw) return { present: false };
  try {
    const m = raw.match(/postgres(?:ql)?:\/\/[^\s'"]+/i);
    const cleaned = (m ? m[0] : raw).replace(/^['"]|['"]$/g, "");
    const url = new URL(cleaned);
    const host = url.hostname;
    return {
      present: true,
      hostStart: host.slice(0, 10),
      hostEnd: host.slice(-14),
      database: url.pathname.replace(/^\//, ""),
      userStart: url.username.slice(0, 4),
      hasPassword: url.password.length > 0,
      params: url.search ? url.search.slice(0, 80) : "(none)",
      length: raw.length,
    };
  } catch (e) {
    return { present: true, parseError: String(e).slice(0, 120), length: raw.length };
  }
}

export async function GET() {
  const info = safeInfo();
  let pool: Pool | null = null;
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      max: 1,
    });
    const t0 = Date.now();
    const now = await pool.query("select now() as t");
    const tables = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
    );
    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      url: info,
      tables: tables.rows.map((r: { table_name: string }) => r.table_name),
      serverTime: now.rows[0]?.t,
    });
  } catch (err) {
    const e = err as { name?: string; code?: string; message?: string };
    return NextResponse.json({
      ok: false,
      url: info,
      errorName: e?.name,
      errorCode: e?.code,
      errorMessage: String(e?.message || err).slice(0, 300),
    });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
