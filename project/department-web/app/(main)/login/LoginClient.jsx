"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, BluePanel, Field, PasswordField, SubmitButton, Icon } from "@components/AuthShell";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: เรียก API เข้าสู่ระบบ เช่น await fetch("/api/auth/login", {...})
      console.log({ email, password, remember });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      left={
        <BluePanel
          title="ยินดีต้อนรับเข้าสู่ระบบจัดการสารสนเทศ"
          description="เข้าสู่ระบบเพื่อเข้าถึงข้อมูลรายวิชา ตารางเรียน ข่าวสาร และทรัพยากรทางการศึกษาสำหรับนักศึกษาและบุคลากรภาควิชาวิทยาการคอมพิวเตอร์"
          items={[
            { icon: Icon.check, heading: "ความปลอดภัยของข้อมูล", text: "ข้อมูลส่วนตัวของคุณได้รับการปกป้องภายใต้มาตรฐาน PDPA" },
            { icon: Icon.help, heading: "ต้องการความช่วยเหลือ?", text: "หากลืมรหัสผ่านหรือมีปัญหาในการใช้งาน ติดต่อสำนักงานภาควิชา" },
          ]}
          footer={
            <>
              <span>© 2026 Computer Science Department</span>
              <span className="flex gap-4">
                <Link href="#" className="hover:text-white">ช่วยเหลือ</Link>
                <Link href="#" className="hover:text-white">นโยบายความเป็นส่วนตัว</Link>
              </span>
            </>
          }
        />
      }
    >
      <h1 className="text-xl font-bold text-[#1a1a1a] sm:text-2xl">ดำเนินการต่อด้วยบัญชีของคุณ</h1>

      {/* Tab สลับ เข้าสู่ระบบ / ลงทะเบียน */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-[#EEEFF1] p-1 text-sm">
        <span
          aria-current="page"
          className="flex items-center justify-center gap-2 rounded-md bg-white py-2 font-medium text-[#1a1a1a] shadow-sm"
        >
          <Icon.user width={16} height={16} /> เข้าสู่ระบบ
        </span>
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 rounded-md py-2 text-gray-500 hover:text-[#1a1a1a]"
        >
          <Icon.userPlus width={16} height={16} /> ลงทะเบียน
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field
          label="อีเมล"
          icon={Icon.mail}
          type="email"
          required
          autoComplete="email"
          placeholder="example@rumail.ru.ac.th"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          action={
            <Link href="#" className="text-xs font-medium text-[#0A3CA8] hover:underline">
              ลืมรหัสผ่าน?
            </Link>
          }
        />

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-[#0A3CA8]"
          />
          จดจำฉันในอุปกรณ์นี้
        </label>

        <SubmitButton disabled={loading}>เข้าสู่ระบบ</SubmitButton>
      </form>
    </AuthShell>
  );
}