// รันไฟล์ .sql ในโฟลเดอร์ database/ กับฐานข้อมูล Supabase (ใช้ DATABASE_URL จาก .env.local)
//   npm run db:run                 -> รัน 001_*.sql, 002_*.sql ... ที่ยังไม่เคยรัน (จำไว้ในตาราง _migrations)
//   npm run db:run -- seed.sql     -> รันไฟล์ที่ระบุ (ไม่จำ, รันซ้ำได้)
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("ไม่พบ DATABASE_URL (ต้องรันผ่าน npm run db:run เพื่อให้โหลด .env.local)");
  process.exit(1);
}

const dir = path.resolve("database");
const args = process.argv.slice(2);
const files = args.length
  ? args
  : fs.readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "off" ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(
    "create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())"
  );
  const done = new Set((await client.query("select name from public._migrations")).rows.map((r) => r.name));

  for (const f of files) {
    const tracked = /^\d{3}_/.test(f);
    if (tracked && done.has(f)) {
      console.log(`skip  ${f} (รันไปแล้ว)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      if (tracked) await client.query("insert into public._migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log(`done  ${f}`);
    } catch (e) {
      await client.query("rollback");
      console.error(`FAIL  ${f}: ${e.message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}
