import { getSessionUser } from "@lib/supabase/auth";

const fail = (message, status = 400) => Response.json({ error: message }, { status });

async function requireStaff() {
  const ctx = await getSessionUser();
  if (!ctx.user) return { res: fail("กรุณาเข้าสู่ระบบ", 401) };
  if (!["admin", "staff"].includes(ctx.profile?.role))
    return { res: fail("ไม่มีสิทธิ์จัดการหมวดหมู่ข่าว", 403) };
  return ctx;
}

export async function POST(request) {
  const ctx = await requireStaff();
  if (ctx.res) return ctx.res;

  try {
    const { name: rawName } = await request.json();
    const name = String(rawName ?? "").trim();
    if (!name) return fail("กรุณากรอกชื่อหมวดหมู่");

    const { data: existing, error: findError } = await ctx.supabase
      .from("news_categories")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    if (findError) return fail(findError.message, 500);
    if (existing) return fail("มีหมวดหมู่นี้อยู่แล้ว", 409);

    const { data, error } = await ctx.supabase
      .from("news_categories")
      .insert({ name })
      .select("id, name")
      .single();
    if (error) return fail(error.message, 500);

    return Response.json(data, { status: 201 });
  } catch (error) {
    return fail(error.message, 500);
  }
}
