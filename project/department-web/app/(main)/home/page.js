import { createClient } from "@supabase/supabase-js";
import HomeClient from "./HomeClient";

// รีเฟรชข้อมูลข่าวทุก 60 วินาที
export const revalidate = 60;

export const metadata = {
  title: "CS Info Portal | สาขาวิทยาการคอมพิวเตอร์",
};

export default async function HomePage() {
  // ถ้าโปรเจกต์มี helper สำหรับสร้าง Supabase server client อยู่แล้ว
  // (จาก @supabase/ssr) สามารถเปลี่ยนมาใช้ตัวนั้นแทนได้
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const nowIso = new Date().toISOString();
  // วันนี้ตามเวลาไทย (รูปแบบ YYYY-MM-DD) คำนวณฝั่ง server เพื่อไม่ให้ hydrate คลาดเคลื่อน
  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

  const [newsRes, catRes, eventsRes] = await Promise.all([
    supabase
      .from("news")
      .select(
        "id, title, summary, cover_url, publish_at, created_at, category_id, news_categories(name)"
      )
      .eq("status", "published")
      .eq("show_on_home", true)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .or(`expire_at.is.null,expire_at.gt.${nowIso}`)
      .order("pinned", { ascending: false })
      .order("publish_at", { ascending: false, nullsFirst: false })
      .limit(12),
    supabase
      .from("news_categories")
      .select("id, name")
      .order("sort_order", { ascending: true })
      .limit(5),
    supabase
      .from("calendar_events")
      .select("id, title, event_type, start_date, end_date")
      .order("start_date", { ascending: true }),
  ]);

  const news = (newsRes.data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    coverUrl: n.cover_url,
    date: n.publish_at ?? n.created_at,
    categoryId: n.category_id,
    categoryName: n.news_categories?.name ?? null,
  }));

  return (
    <HomeClient
      news={news}
      categories={catRes.data ?? []}
      events={eventsRes.data ?? []}
      today={todayIso}
    />
  );
}
