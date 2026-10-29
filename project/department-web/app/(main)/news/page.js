import { createClient } from "@supabase/supabase-js";
import News from "./NewsClient";

// รีเฟรชข้อมูลข่าวทุก 60 วินาที
export const revalidate = 60;

export const metadata = {
  title: "ข่าวสารและกิจกรรม | CS Info Portal",
};

// ประมาณเวลาอ่าน (ภาษาไทยไม่มีช่องว่างระหว่างคำ จึงประมาณจากจำนวนตัวอักษร)
function estimateReadMinutes(text) {
  const len = (text ?? "").length;
  return Math.max(1, Math.round(len / 700));
}

export default async function NewsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const nowIso = new Date().toISOString();

  const [newsRes, catRes] = await Promise.all([
    supabase
      .from("news")
      .select(
        "id, title, summary, content, cover_url, publish_at, created_at, pinned, category_id, news_categories(name), author:profiles(full_name)"
      )
      .eq("status", "published")
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .or(`expire_at.is.null,expire_at.gt.${nowIso}`)
      .order("pinned", { ascending: false })
      .order("publish_at", { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from("news_categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
  ]);

  // ไม่ส่ง content ทั้งก้อนไปที่ client เพื่อลดขนาดข้อมูล
  const news = (newsRes.data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    coverUrl: n.cover_url,
    date: n.publish_at ?? n.created_at,
    categoryId: n.category_id,
    categoryName: n.news_categories?.name ?? null,
    authorName: n.author?.full_name ?? null,
    readMinutes: estimateReadMinutes(n.content),
  }));

  return <News news={news} categories={catRes.data ?? []} />;
}
