// /api/news  --  POST: สร้าง/แก้ไขข่าว (FormData จาก AddNewForm)  PATCH: เปลี่ยนสถานะ  DELETE: ลบ
// สิทธิ์จริงคุมด้วย RLS ใน Supabase (admin/staff เท่านั้น) ที่นี่เช็คซ้ำเพื่อให้ตอบ error ชัดเจน
import { getSessionUser } from "@lib/supabase/auth";
import { NEWS_SELECT, toNewsRecord, fromLocal } from "@lib/news";

const BUCKET = "news-files";
const STATUSES = ["draft", "published", "archived"];
const fail = (message, status = 400) =>
  Response.json({ error: message }, { status });

async function requireStaff() {
  const ctx = await getSessionUser();
  if (!ctx.user) return { res: fail("กรุณาเข้าสู่ระบบ", 401) };
  if (!["admin", "staff"].includes(ctx.profile?.role))
    return { res: fail("ไม่มีสิทธิ์จัดการข่าว", 403) };
  return ctx;
}

const extOf = (name) =>
  name.includes(".")
    ? name
        .slice(name.lastIndexOf("."))
        .toLowerCase()
        .replace(/[^.a-z0-9]/g, "")
    : "";
// ชื่อไฟล์ไทยใช้เป็น key ใน Storage ไม่ได้ จึงตั้งชื่อใหม่เป็น uuid และเก็บชื่อจริงไว้ในตาราง
const newKey = (folder, newsId, name) =>
  `${folder}/${newsId}/${crypto.randomUUID()}${extOf(name)}`;
const publicUrl = (supabase, key) =>
  supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
const keyFromUrl = (url) =>
  url?.includes(`/${BUCKET}/`)
    ? decodeURIComponent(url.split(`/${BUCKET}/`)[1])
    : null;

async function fetchRecord(supabase, id) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_SELECT)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return toNewsRecord(data);
}

export async function POST(request) {
  const ctx = await requireStaff();
  if (ctx.res) return ctx.res;
  const { supabase, user, profile } = ctx;

  try {
    const fd = await request.formData();
    const id = fd.get("id") || null;
    const status = fd.get("status");
    const title = String(fd.get("title") ?? "").trim();
    if (!title) return fail("กรุณากรอกหัวข้อข่าว");
    if (!STATUSES.includes(status)) return fail("สถานะไม่ถูกต้อง");

    const { data: cat } = await supabase
      .from("news_categories")
      .select("id")
      .eq("name", fd.get("category"))
      .maybeSingle();
    if (!cat) return fail("ไม่พบหมวดหมู่ที่เลือก");

    const publishAt = fromLocal(fd.get("publishAt"));
    const expireAt = fromLocal(fd.get("expireAt"));
    if (expireAt && publishAt && expireAt <= publishAt)
      return fail("วันหมดอายุต้องอยู่หลังวันเผยแพร่");

    const row = {
      title,
      summary: fd.get("summary") || null,
      content: fd.get("content") || null,
      category_id: cat.id,
      tags: JSON.parse(fd.get("tags") || "[]"),
      publish_at: publishAt,
      expire_at: expireAt, // null = ไม่หมดอายุ
      status,
      show_on_home: fd.get("showOnHome") === "true",
      pinned: fd.get("pinned") === "true",
    };

    let newsId = id;
    let oldCover = null;
    if (id) {
      const { data: old, error } = await supabase
        .from("news")
        .select("cover_url")
        .eq("id", id)
        .single();
      if (error) return fail("ไม่พบข่าวนี้หรือไม่มีสิทธิ์แก้ไข", 404);
      oldCover = old.cover_url;
      const { error: upErr } = await supabase
        .from("news")
        .update(row)
        .eq("id", id);
      if (upErr) return fail(upErr.message, 500);
    } else {
      const { data, error } = await supabase
        .from("news")
        .insert({
          ...row,
          author_id: user.id,
          author_name: profile.full_name || profile.email,
        })
        .select("id")
        .single();
      if (error) return fail(error.message, 500);
      newsId = data.id;
    }

    // ----- ปก -----
    const cover = fd.get("cover");
    const keepCover = fd.get("keepCover") === "true";
    if (cover instanceof File && cover.size > 0) {
      const key = newKey("covers", newsId, cover.name);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, cover, { contentType: cover.type });
      if (error) return fail(`อัปโหลดปกไม่สำเร็จ: ${error.message}`, 500);
      await supabase
        .from("news")
        .update({ cover_url: publicUrl(supabase, key) })
        .eq("id", newsId);
    } else if (!keepCover) {
      await supabase.from("news").update({ cover_url: null }).eq("id", newsId);
    }
    const changedCover =
      (cover instanceof File && cover.size > 0) || !keepCover;
    if (oldCover && changedCover && keyFromUrl(oldCover))
      await supabase.storage.from(BUCKET).remove([keyFromUrl(oldCover)]);

    // ----- เอกสารแนบ: ลบที่ถูกเอาออก แล้วเพิ่มไฟล์ใหม่ -----
    if (id) {
      const keep = new Set(JSON.parse(fd.get("keepDocuments") || "[]"));
      const { data: existing } = await supabase
        .from("news_attachments")
        .select("id, file_name, file_path")
        .eq("news_id", id);
      const gone = (existing ?? []).filter((a) => !keep.has(a.file_name));
      if (gone.length) {
        await supabase.storage
          .from(BUCKET)
          .remove(gone.map((a) => a.file_path));
        await supabase
          .from("news_attachments")
          .delete()
          .in(
            "id",
            gone.map((a) => a.id),
          );
      }
    }
    for (const file of fd.getAll("documents")) {
      if (!(file instanceof File) || file.size === 0) continue;
      const key = newKey("docs", newsId, file.name);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, file, { contentType: file.type || undefined });
      if (error)
        return fail(`อัปโหลด "${file.name}" ไม่สำเร็จ: ${error.message}`, 500);
      await supabase
        .from("news_attachments")
        .insert({
          news_id: newsId,
          file_name: file.name,
          file_path: key,
          size_bytes: file.size,
        });
    }

    return Response.json(await fetchRecord(supabase, newsId));
  } catch (e) {
    return fail(e.message, 500);
  }
}

export async function PATCH(request) {
  const ctx = await requireStaff();
  if (ctx.res) return ctx.res;
  const { id, status } = await request.json();
  if (!STATUSES.includes(status)) return fail("สถานะไม่ถูกต้อง");
  const { data, error } = await ctx.supabase
    .from("news")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message, 500);
  if (!data.length) return fail("ไม่พบข่าวนี้หรือไม่มีสิทธิ์แก้ไข", 404);
  return Response.json({ id, status });
}

export async function DELETE(request) {
  const ctx = await requireStaff();
  if (ctx.res) return ctx.res;
  const { supabase } = ctx;
  const { id } = await request.json();

  const { data: news } = await supabase
    .from("news")
    .select("cover_url")
    .eq("id", id)
    .maybeSingle();
  const { data: files } = await supabase
    .from("news_attachments")
    .select("file_path")
    .eq("news_id", id);
  const { data, error } = await supabase
    .from("news")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return fail(error.message, 500);
  if (!data.length) return fail("ไม่พบข่าวนี้หรือไม่มีสิทธิ์ลบ", 404);

  // ลบไฟล์ใน Storage หลังลบข่าวสำเร็จ (ถ้าลบไฟล์พลาด ข่าวก็หายไปแล้ว เหลือแค่ไฟล์ค้าง)
  const keys = [
    ...(files ?? []).map((f) => f.file_path),
    keyFromUrl(news?.cover_url),
  ].filter(Boolean);
  if (keys.length) await supabase.storage.from(BUCKET).remove(keys);
  return Response.json({ id });
}
