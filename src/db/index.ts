import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

/**
 * Bulletproof DATABASE_URL handling.
 * Accepts messy pastes like:  psql 'postgresql://user:pass@host/db?sslmode=require'
 * and handles Neon/serverless SSL correctly.
 */
function resolveConnection(): PoolConfig {
  let raw = (process.env.DATABASE_URL || "").trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is required. In Vercel: Project Settings → Environment Variables → DATABASE_URL = your Neon connection string.",
    );
  }

  // If someone pasted `psql 'postgresql://...'` extract just the URL
  const extracted = raw.match(/postgres(?:ql)?:\/\/[^\s'"]+/i);
  if (extracted) raw = extracted[0];
  raw = raw.replace(/^["']|["']$/g, "").trim();

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid postgres connection string.");
  }

  // These params break node-postgres — we manage SSL ourselves instead.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  const config: PoolConfig = {
    connectionString: url.toString(),
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
  if (!isLocal) {
    // Neon / hosted Postgres: need TLS, don't verify CA chain (error-proof).
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool(resolveConnection());

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
