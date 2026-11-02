import CalenderClient from "./CalenderClient";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@lib/supabase/auth";

export default async function CalenderPage() {
  // 1. สร้าง Supabase Client โดยใช้ชื่อตัวแปร Env ที่ตรงกับของโปรเจกต์
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  // 2. ดึงข้อมูล User Session
  const { user, profile } = await getSessionUser();

  // 3. ดึงข้อมูลกิจกรรมทั้งหมดจากตาราง calendar_events
  const { data: events, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching calendar events:", error.message);
  }

  // 4. ส่งข้อมูลไปยัง CalenderClient
  return (
    <CalenderClient 
      initialEvents={events || []} 
      currentUser={{
        id: user?.id,
        email: profile?.email || user?.email,
        name: profile?.full_name || profile?.email || "ผู้ใช้งาน",
        role: profile?.role || "student"
      }} 
    />
  );
}