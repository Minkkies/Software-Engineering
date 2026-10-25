"use client";
// components/navbar.jsx
// Navbar หน้าเว็บสาธารณะ (กลุ่ม (main)) ตามแบบ Visily
// ใช้ใน app/(main)/layout.jsx:  <Navbar />  หรือเมื่อล็อกอินแล้ว  <Navbar user={{ name, avatar }} onLogout={...} />

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./IconComponent";
import Button from "./button";
import { createClient } from "@lib/supabase/client";

// ชื่อโฟลเดอร์ใน app/(main)/ => URL (route group ไม่ปรากฏใน URL)
export const NAV_LINKS = [
  { label: "หน้าแรก", href: "/home" },
  { label: "ข่าวสาร", href: "/news" }, // ต้องสร้าง app/(main)/news
  { label: "รายวิชา", href: "/course" },
  { label: "ตารางเรียน", href: "/schedule" },
  { label: "คณาจารย์", href: "/FacultyDirectory" },
  { label: "ปฏิทิน", href: "/calender" },
  //////////////////////////// ทำเงื่อนไขให้เห็นเฉพาะผู้ดูแลระบบ (admin) เท่านั้น ////////////////////////////
  { label: "เจ้าหน้าที่", href: "/Admin" }
];

const LOGIN_HREF = "/login";

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * @param {{
 *   user?: {name: string, avatar?: string} | null,
 *   onLogout?: () => void
 * }} props
 */
export default function Navbar({ user = null, onLogout }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) return;
    }
    router.push("/home");
    router.refresh();
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/news?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-1000 border-b border-gray-200 bg-[#F8F9FB]/95 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-6 px-4 sm:px-6">
        {/* โลโก้ */}
        <Link href="/home" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0033A0] text-white">
            <Icon name="graduationCap" size={20} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-[#1a1a1a]">
              CS Info Portal
            </span>
            <span className="block text-[10px] text-gray-500">
              สาขาวิทยาการคอมพิวเตอร์
            </span>
          </span>
        </Link>

        {/* เมนูหลัก (desktop) */}
        <nav className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[#0033A0]/10 text-[#0033A0]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#0033A0]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* ช่องค้นหา (desktop) */}
          <form onSubmit={submitSearch} className="relative hidden lg:block">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาบทความ, รายวิชา..."
              className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20"
            />
          </form>

          {/* ผู้ใช้ / ปุ่มเข้าสู่ระบบ */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0033A0]/10 text-[#0033A0]">
                    <Icon name="user" size={16} />
                  </span>
                )}
                <span className="hidden max-w-48 text-xs text-[#1a1a1a] sm:block">
                  <span className="block truncate font-semibold">{user.name}</span>
                  {user.email && <span className="block truncate text-[10px] text-gray-500">{user.email}</span>}
                </span>
              </div>
             
            </div>
          ) : (
            <Button href={LOGIN_HREF} size="sm" icon="user">
              เข้าสู่ระบบ
            </Button>
          )}

          {/* ปุ่มเมนูมือถือ */}
          <Button
            variant="ghost"
            size="sm"
            icon={mobileOpen ? "x" : "menu"}
            iconSize={22}
            aria-label="เปิด/ปิดเมนู"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="xl:hidden"
          />
        </div>
      </div>

      {/* เมนูมือถือ */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 xl:hidden">
          <form onSubmit={submitSearch} className="relative mb-3 lg:hidden">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาบทความ, รายวิชา..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-[#0033A0]"
            />
          </form>
          <nav className="grid grid-cols-2 gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-[#0033A0]/10 text-[#0033A0]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {user && (
            <Button
              variant="outline"
              size="sm"
              icon="logout"
              fullWidth
              onClick={handleLogout}
              className="mt-3"
            >
              ออกจากระบบ
            </Button>
          )}
        </div>
      )}
    </header>
  );
}