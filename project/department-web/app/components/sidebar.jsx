"use client";
// components/sidebar.jsx
// Sidebar หลังบ้าน (กลุ่ม (backend)) ตามแบบ Visily
//
// ใช้ใน app/(backend)/layout.jsx เป็นเมนูประจำของหน้า Admin

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./icon";

// route group (backend) กับ (main) ใช้ชื่อโฟลเดอร์ซ้ำกัน (home, course, calender)
// ซึ่งจะได้ URL ชนกัน จึงแนะนำให้ย้ายโฟลเดอร์หลังบ้านไปไว้ใต้ app/(backend)/admin/
// ถ้าไม่ย้าย ให้เปลี่ยนค่านี้เป็น "" (แต่จะชนกับ (main) อยู่ดี)
export const ADMIN_BASE = "/Admin";

export const SIDEBAR_ITEMS = [
  { label: "แดชบอร์ด", href: "/Admin", icon: "dashboard" },
  { label: "จัดการข่าวสาร", href: `${ADMIN_BASE}/news`, icon: "news" },
  { label: "จัดการหลักสูตร", href: `${ADMIN_BASE}/course`, icon: "book" },
  { label: "จัดการปฏิทิน", href: `${ADMIN_BASE}/calender`, icon: "calendar" },
  { label: "บุคลากรและอาจารย์", href: `${ADMIN_BASE}/staff-teacher`, icon: "users" },
  { label: "จัดการผู้ใช้งาน", href: `${ADMIN_BASE}/users`, icon: "userCog" },
];

export default function Sidebar({ version = "v1.0.0" }) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-15 inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-[#0033A0] text-white">
        {/* หัวข้อระบบ */}
        <div className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <h2 className="text-base font-bold leading-tight">
              ระบบจัดการสารสนเทศ
            </h2>
            <p className="mt-0.5 text-[11px] text-white/70">
              สาขาวิทยาการคอมพิวเตอร์
            </p>
          </div>
        </div>

        {/* รายการเมนู */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {SIDEBAR_ITEMS.map((item) => {
            const href = item.href;
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ท้าย sidebar */}
        <div className="mx-6 border-t border-white/15 py-4 text-[11px] text-white/60">
          {version} Admin Portal
        </div>
    </aside>
  );
}