"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@lib/supabase/client";
import { AuthShell, BluePanel, Field, PasswordField, SubmitButton, Icon } from "@components/AuthShell";

export default function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    password: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!accepted) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const studentId = form.studentId.trim();
    const email = form.email.trim().toLowerCase();

    if (!/^\d{8}$|^\d{10}$/.test(studentId)) {
      setError("รหัสนักศึกษาต้องเป็นตัวเลข 8 หรือ 10 หลัก");
      return;
    }
    if (form.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const supabase = createClient();

      // สร้าง user ใน Supabase Auth ข้อมูลใน options.data จะถูก trigger
      // handle_new_user ใช้สร้างแถวใน public.profiles (role = student เสมอ)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { full_name: `${firstName} ${lastName}`, student_id: studentId },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        if (/already registered|already exists/i.test(signUpError.message)) {
          setError("อีเมลนี้ถูกใช้งานแล้ว");
        } else if (/database error/i.test(signUpError.message)) {
          setError("ไม่สามารถสร้างบัญชีได้ รหัสนักศึกษานี้อาจถูกใช้งานแล้ว");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // เปิด Confirm email ไว้: อีเมลที่มีบัญชีอยู่แล้วจะไม่ error แต่ identities ว่าง
      if (data.user && data.user.identities?.length === 0) {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
        return;
      }

      if (data.session) {
        // ปิด Confirm email: ล็อกอินให้อัตโนมัติ
        router.push("/");
        router.refresh();
      } else {
        // เปิด Confirm email: ต้องกดลิงก์ในอีเมลก่อน
        setSuccess("สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ");
        setForm({ firstName: "", lastName: "", studentId: "", email: "", password: "" });
        setAccepted(false);
      }
    } catch (err) {
      setError(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      left={
        <BluePanel
          title="สมัครสมาชิกใหม่"
          highlight="เพื่อเริ่มใช้งานระบบ"
          description="ลงทะเบียนเพื่อเข้าถึงตารางเรียน ข้อมูลรายวิชา และทรัพยากรการเรียนรู้ สำหรับนักศึกษาสาขาวิทยาการคอมพิวเตอร์โดยเฉพาะ"
          items={[
            { icon: Icon.check, heading: "ความปลอดภัยของข้อมูล", text: "ข้อมูลส่วนตัวของคุณได้รับการปกป้องภายใต้มาตรฐาน PDPA ของมหาวิทยาลัย" },
            { icon: Icon.help, heading: "ต้องการความช่วยเหลือ?", text: "หากมีปัญหาในการลงทะเบียน สามารถติดต่อเจ้าหน้าที่ห้องสำนักงานภาควิชาได้ในเวลาทำการ" },
          ]}
          footer={<span>© 2026 Computer Science Department</span>}
        >
        </BluePanel>
      }
    >
      <h1 className="text-xl font-bold text-[#1a1a1a] sm:text-2xl">ลงทะเบียนนักศึกษา</h1>
      <p className="mt-1 text-sm text-gray-500">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งาน</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="ชื่อ"
            icon={Icon.user}
            required
            autoComplete="given-name"
            placeholder="กรอกชื่อจริง"
            value={form.firstName}
            onChange={update("firstName")}
          />
          <Field
            label="นามสกุล"
            required
            autoComplete="family-name"
            placeholder="กรอกนามสกุล"
            value={form.lastName}
            onChange={update("lastName")}
          />
        </div>

        <Field
          label="รหัสนักศึกษา"
          icon={Icon.idCard}
          required
          inputMode="numeric"
          placeholder="เช่น 64010123"
          value={form.studentId}
          onChange={update("studentId")}
        />

        <Field
          label="อีเมลมหาวิทยาลัย"
          icon={Icon.mail}
          type="email"
          required
          autoComplete="email"
          placeholder="example@student.ac.th"
          value={form.email}
          onChange={update("email")}
        />

        <PasswordField
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร"
          value={form.password}
          onChange={update("password")}
        />

        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#0A3CA8]"
          />
          <span>
            ฉันยอมรับ{" "}
            <Link href="#" className="font-semibold text-[#0A3CA8] hover:underline">
              ข้อกำหนดและเงื่อนไข
            </Link>{" "}
            ในการใช้งานระบบ รวมถึงการคุ้มครองข้อมูลส่วนบุคคลตามนโยบาย PDPA
          </span>
        </label>

        <div className="mt-2">
          <SubmitButton disabled={loading || !accepted}>{loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}</SubmitButton>
        </div>

        <p className="text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-semibold text-[#0A3CA8] hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}