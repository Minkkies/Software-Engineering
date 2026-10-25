import { NextResponse } from "next/server";
import { getSessionUser } from "@lib/supabase/auth";
import { createAdminClient } from "@lib/supabase/admin";

const ROLES = ["admin", "staff", "teacher", "student"];

// ตรวจว่าผู้เรียกเป็น admin ที่ยังใช้งานอยู่
async function requireAdmin() {
  const { user, profile } = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  if (profile?.role !== "admin" || !profile?.is_active) {
    return { error: NextResponse.json({ error: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 403 }) };
  }
  return { user };
}

// สร้างผู้ใช้ใหม่: auth.users + public.profiles
async function createUser(request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const studentId = String(body.studentId ?? "").trim();
  const role = body.role;
  const isActive = body.status !== "suspended";

  if (!firstName || !lastName) return NextResponse.json({ error: "กรุณากรอกชื่อและนามสกุล" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ error: "บทบาทไม่ถูกต้อง" }, { status: 400 });
  if (role === "student" && !studentId) return NextResponse.json({ error: "นักศึกษาต้องระบุรหัสประจำตัว" }, { status: 400 });

  const admin = createAdminClient();
  const fullName = `${firstName} ${lastName}`;

  // 1) สร้าง user ใน Supabase Auth (ยืนยันอีเมลให้เลย เพราะ admin เป็นคนสร้าง)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    const duplicated = /already|registered|exists/i.test(createError.message);
    return NextResponse.json(
      { error: duplicated ? "อีเมลนี้ถูกใช้งานแล้ว" : createError.message },
      { status: duplicated ? 409 : 400 }
    );
  }

  // 2) สร้าง profile (upsert เผื่อมี trigger สร้างแถวไว้ก่อนแล้ว)
  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    full_name: fullName,
    email,
    student_id: studentId || null,
    role,
    is_active: isActive,
  });

  if (profileError) {
    // ย้อนกลับ: ลบ user ที่เพิ่งสร้าง ไม่ให้เหลือบัญชีที่ไม่มี profile
    await admin.auth.admin.deleteUser(created.user.id);
    const duplicated = profileError.code === "23505";
    return NextResponse.json(
      { error: duplicated ? "รหัสประจำตัวนี้ถูกใช้งานแล้ว" : profileError.message },
      { status: duplicated ? 409 : 400 }
    );
  }

  return NextResponse.json({ id: created.user.id }, { status: 201 });
}

// ลบผู้ใช้ (UsersClient เรียกใช้): ลบจาก auth.users แล้ว profile ถูกลบตาม cascade
async function deleteUser(request) {
  const { user, error: authError } = await requireAdmin();
  if (authError) return authError;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบ id ผู้ใช้งาน" }, { status: 400 });
  if (id === user.id) return NextResponse.json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

// ครอบด้วย try/catch เพื่อให้ตอบ JSON เสมอ (ไม่ใช่ 500 ที่ body ว่าง)
function withErrorHandling(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (err) {
      console.error("[/api/admin/users]", err);
      return NextResponse.json(
        { error: err?.message || "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" },
        { status: 500 }
      );
    }
  };
}

export const POST = withErrorHandling(createUser);
export const DELETE = withErrorHandling(deleteUser);