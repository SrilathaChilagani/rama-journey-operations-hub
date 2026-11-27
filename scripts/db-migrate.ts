// Applies db/migrations/*.sql in order, once each. Run: bun run db:migrate
// Reads DATABASE_URL from the environment (bun loads .env.local automatically).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");

const dir = join(import.meta.dir, "..", "db", "migrations");
const pool = new Pool({ connectionString: url });
const db = await pool.connect();
try {
  await db.query(`create table if not exists schema_migrations (
    name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await db.query(`select name from schema_migrations`)).rows.map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    await db.query("begin");
    try {
      await db.query(readFileSync(join(dir, f), "utf8"));
      await db.query(`insert into schema_migrations (name) values ($1)`, [f]);
      await db.query("commit");
      console.log(`applied ${f}`);
    } catch (err) {
      await db.query("rollback");
      throw err;
    }
  }
  console.log("database is up to date");
} finally {
  db.release();
  await pool.end();
}
