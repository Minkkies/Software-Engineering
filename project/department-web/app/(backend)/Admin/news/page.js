// app/(backend)/Admin/news/page.js  ->  /Admin/news
// Server component: เตรียมข้อมูลข่าวแล้วส่งให้ NewsClient (ตัวที่โต้ตอบกับผู้ใช้)

import NewsClient from "./NewsClient";
import { createClient } from "@lib/supabase/server";
import { NEWS_SELECT, toNewsRecord } from "@lib/news";

export const metadata = {
  title: "จัดการข่าวสาร | CS Info Portal",
};

async function getNews() {
  const supabase = await createClient();
  const [{ data: rows, error: newsError }, { data: categoryRows, error: categoryError }] =
    await Promise.all([
      supabase.from("news").select(NEWS_SELECT).order("created_at", { ascending: false }),
      supabase.from("news_categories").select("name").order("sort_order").order("name"),
    ]);

  if (newsError) throw new Error(`โหลดข่าวสารไม่สำเร็จ: ${newsError.message}`);
  if (categoryError) throw new Error(`โหลดหมวดหมู่ไม่สำเร็จ: ${categoryError.message}`);

  return {
    news: (rows ?? []).map(toNewsRecord),
    categories: (categoryRows ?? []).map((row) => row.name),
  };
}

export default async function NewsPage() {
  const { news, categories } = await getNews();
  return <NewsClient initialNews={news} initialCategories={categories} />;
}