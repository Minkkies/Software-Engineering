"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, BluePanel, Field, PasswordField, SubmitButton, Icon } from "@components/AuthShell";

export default function RegisterClient() {
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

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!accepted) return;
    setLoading(true);
    try {
      // TODO: เรียก API สมัครสมาชิก เช่น await fetch("/api/auth/register", {...})
      console.log(form);
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
          {/* วางรูปที่ public/images/register-student.jpg (ถ้าไม่มีรูปจะซ่อนอัตโนมัติ) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/register-student.jpg"
            alt=""
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="mx-auto mt-2 aspect-[4/3] w-4/5 rounded-md object-cover"
          />
        </BluePanel>
      }
    >
      <h1 className="text-xl font-bold text-[#1a1a1a] sm:text-2xl">ลงทะเบียนนักศึกษา</h1>
      <p className="mt-1 text-sm text-gray-500">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งาน</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
          <SubmitButton disabled={loading || !accepted}>สมัครสมาชิก</SubmitButton>
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