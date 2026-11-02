// app/(backend)/Admin/page.js
import DashBoard from "./DashBoard";
import { NEWS_SELECT } from "@lib/news";
import { createClient } from "@lib/supabase/server";

export const revalidate = 0;

async function getLatestNews() {
  const supabase = await createClient();
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    { data: categories, error: categoryError },
    { count: studentCount, error: studentError },
    { count: publishedNewsCount, error: publishedNewsError },
    { count: currentStudents, error: currentStudentsError },
    { count: previousStudents, error: previousStudentsError },
    { count: currentPublishedNews, error: currentPublishedNewsError },
    { count: previousPublishedNews, error: previousPublishedNewsError },
    { data: staffRows, error: staffError },
  ] = await Promise.all([
    supabase.from("news_categories").select("id").ilike("name", "%กิจกรรม%"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("news").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("role", "student").gte("created_at", currentMonthStart),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("role", "student").gte("created_at", previousMonthStart).lt("created_at", currentMonthStart),
    supabase.from("news").select("id", { count: "exact", head: true })
      .eq("status", "published").gte("publish_at", currentMonthStart),
    supabase.from("news").select("id", { count: "exact", head: true })
      .eq("status", "published").gte("publish_at", previousMonthStart).lt("publish_at", currentMonthStart),
    supabase.from("faculty_members")
      .select("id, full_name, position, photo_url, is_active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (categoryError) throw new Error(`โหลดหมวดหมู่ข่าวไม่สำเร็จ: ${categoryError.message}`);
  if (studentError) throw new Error(`โหลดจำนวนนักศึกษาไม่สำเร็จ: ${studentError.message}`);
  if (publishedNewsError) throw new Error(`โหลดจำนวนข่าวที่เผยแพร่ไม่สำเร็จ: ${publishedNewsError.message}`);
  if (currentStudentsError || previousStudentsError) {
    throw new Error(`โหลดแนวโน้มจำนวนนักศึกษาไม่สำเร็จ: ${(currentStudentsError || previousStudentsError).message}`);
  }
  if (currentPublishedNewsError || previousPublishedNewsError) {
    throw new Error(`โหลดแนวโน้มข่าวที่เผยแพร่ไม่สำเร็จ: ${(currentPublishedNewsError || previousPublishedNewsError).message}`);
  }
  if (staffError) throw new Error(`โหลดข้อมูลบุคลากรไม่สำเร็จ: ${staffError.message}`);

  const activityCategoryIds = (categories ?? []).map(({ id }) => id);
  const activityQueries = activityCategoryIds.length
    ? await Promise.all([
        supabase.from("news").select("id", { count: "exact", head: true }).in("category_id", activityCategoryIds),
        supabase.from("news").select("id", { count: "exact", head: true })
          .in("category_id", activityCategoryIds).gte("created_at", currentMonthStart),
        supabase.from("news").select("id", { count: "exact", head: true })
          .in("category_id", activityCategoryIds).gte("created_at", previousMonthStart).lt("created_at", currentMonthStart),
      ])
    : [{ count: 0, error: null }, { count: 0, error: null }, { count: 0, error: null }];
  const [
    { count: activityCount, error: activityError },
    { count: currentActivities, error: currentActivitiesError },
    { count: previousActivities, error: previousActivitiesError },
  ] = activityQueries;

  if (activityError || currentActivitiesError || previousActivitiesError) {
    throw new Error(`โหลดข้อมูลกิจกรรมไม่สำเร็จ: ${(activityError || currentActivitiesError || previousActivitiesError).message}`);
  }

  const [
    { data, error },
    { data: trendRows, error: trendError },
  ] = await Promise.all([
    supabase.from("news").select(NEWS_SELECT).order("created_at", { ascending: false }).limit(5),
    supabase.from("news").select("created_at, views")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()),
  ]);

  if (error) throw new Error(`โหลดข่าวสารล่าสุดไม่สำเร็จ: ${error.message}`);
  if (trendError) throw new Error(`โหลดสถิติข่าวสารไม่สำเร็จ: ${trendError.message}`);

  const newsViews = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      label: date.toLocaleDateString("th-TH", { month: "short" }),
      year: date.getFullYear(),
      month: date.getMonth(),
      views: 0,
    };
  });
  for (const row of trendRows ?? []) {
    const date = new Date(row.created_at);
    const month = newsViews.find((item) => item.year === date.getFullYear() && item.month === date.getMonth());
    if (month) month.views += row.views ?? 0;
  }

  const trend = (current, previous) =>
    previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

  return {
    news: (data ?? []).map((news) => ({
      id: news.id,
      title: news.title,
      author: news.author?.full_name || news.author?.email || "-",
      date: news.created_at,
      status: news.status,
      views: news.views ?? 0,
    })),
    newsViews,
    staff: (staffRows ?? []).map((member) => ({
      id: member.id,
      name: member.full_name,
      role: member.position || "บุคลากร",
      photoUrl: member.photo_url,
      active: member.is_active,
    })),
    stats: {
      students: studentCount ?? 0,
      publishedNews: publishedNewsCount ?? 0,
      monthlyActivities: activityCount ?? 0,
      trends: {
        students: trend(currentStudents ?? 0, previousStudents ?? 0),
        publishedNews: trend(currentPublishedNews ?? 0, previousPublishedNews ?? 0),
        activities: trend(currentActivities ?? 0, previousActivities ?? 0),
      },
    },
  };
}

export default async function AdminPage() {
  const { news, newsViews, stats, staff } = await getLatestNews();
  return <DashBoard latestNews={news} newsViews={newsViews} stats={stats} staff={staff} />;
}
