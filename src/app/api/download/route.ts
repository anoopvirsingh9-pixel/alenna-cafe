import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import JSZip from "jszip";

const ROOT = join(process.cwd());

const INCLUDE_PATTERNS = [
  "src",
  "public",
  "drizzle.config.json",
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "tailwind.config.js",
  "postcss.config.js",
  "eslint.config.mjs",
  ".env.example",
];

const EXCLUDE = [
  "node_modules",
  ".next",
  ".git",
  ".env.local",
  ".DS_Store",
  ".tmp",
];

async function walk(dir: string, base: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (EXCLUDE.some((ex) => rel.split(sep).includes(ex))) continue;
    if (entry.isDirectory()) {
      out.push(...(await walk(full, base)));
    } else {
      out.push(rel);
    }
  }
  return out;
}

export async function GET() {
  const files = await walk(ROOT, ROOT);
  const wanted = files.filter((f) =>
    INCLUDE_PATTERNS.some((p) => f === p || f.startsWith(p + sep)),
  );

  const zip = new JSZip();
  for (const rel of wanted) {
    const full = join(ROOT, rel);
    try {
      const s = await stat(full);
      if (!s.isFile()) continue;
      const buf = await readFile(full);
      zip.file(rel, buf);
    } catch {
      // skip
    }
  }

  const readme = `# Alenna Cafe - Setup Instructions

## 1. Install Node.js (LTS)
Download from https://nodejs.org

## 2. Install PostgreSQL
- Download from https://www.postgresql.org/download/windows/
- Set password to: postgres
- Port: 5432

## 3. Create the database
Open pgAdmin or SQL Shell and create database:
  CREATE DATABASE app_db;

## 4. Create the .env file
Rename .env.example to .env with:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
ADMIN_PIN=4400

## 5. Start the website
Open terminal in this folder and run:
  npm install
  npx drizzle-kit push
  npm run dev -- --webpack

Then open http://localhost:3000
Staff dashboard: http://localhost:3000/admin (Code: 4400)
`;
  zip.file("README.md", readme);

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="alenna-cafe.zip"',
    },
  });
}
