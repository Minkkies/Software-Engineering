// ใช้ฝั่ง server เท่านั้น (Route Handler / Server Action)
// ห้าม import ในไฟล์ที่มี "use client" เพราะ service role key ข้าม RLS ทั้งหมด
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    throw new Error(`ยังไม่ได้ตั้งค่าใน .env.local: ${missing.join(", ")}`);
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
