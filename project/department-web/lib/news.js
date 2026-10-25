// ตัวช่วยแปลงข้อมูลข่าวระหว่างฐานข้อมูล <-> รูปแบบที่หน้า Admin ใช้
export const NEWS_SELECT =
  "*, category:news_categories(name), author:profiles(full_name, email), attachments:news_attachments(id, file_name, file_path, size_bytes)";

const storageUrl = (filePath) => {
  if (!filePath || !process.env.NEXT_PUBLIC_SUPABASE_URL) return "";
  const path = filePath.split("/").map(encodeURIComponent).join("/");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/news-files/${path}`;
};

const TZ_MS = 7 * 3600 * 1000; // เวลาไทย UTC+7 (ไม่มี DST)

// timestamptz -> "YYYY-MM-DDTHH:mm" (เวลาไทย) ให้ตรงกับ <input type="datetime-local">
export const toLocal = (ts) => (ts ? new Date(new Date(ts).getTime() + TZ_MS).toISOString().slice(0, 16) : "");

// "YYYY-MM-DDTHH:mm" (เวลาไทย) -> ISO สำหรับเก็บลง DB
export const fromLocal = (s) => (s ? new Date(`${s}:00+07:00`).toISOString() : null);

export function toNewsRecord(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    content: row.content ?? "",
    category: row.category?.name ?? "",
    tags: row.tags ?? [],
    author: row.author?.full_name || row.author?.email || "",
    publishAt: toLocal(row.publish_at ?? row.created_at),
    expireAt: toLocal(row.expire_at),
    status: row.status,
    views: row.views ?? 0,
    showOnHome: row.show_on_home,
    pinned: row.pinned,
    coverUrl: row.cover_url ?? "",
    documents: (row.attachments ?? []).map((a) => ({
      name: a.file_name,
      size: a.size_bytes ?? 0,
      url: storageUrl(a.file_path),
    })),
  };
}