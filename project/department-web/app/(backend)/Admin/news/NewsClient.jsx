"use client";
// app/(backend)/admin/layout.jsx
// ครอบทุกหน้าใต้ /admin ด้วย Sidebar + แถบบน

import { useState } from "react";
import Sidebar from "@components/sidebar";
import Button from "@components/button";
import Icon from "@components/icon";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-8">
          <Button
            variant="ghost"
            size="sm"
            icon="menu"
            iconSize={22}
            aria-label="เปิดเมนู"
            onClick={() => setOpen(true)}
            className="lg:hidden"
          />
          <div className="relative ml-auto hidden w-64 sm:block">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="ค้นหา..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-[#F5F6F8] pl-9 pr-3 text-sm outline-none focus:border-[#0033A0]"
            />
          </div>
          <Button variant="ghost" size="sm" icon="bell" aria-label="แจ้งเตือน" className="ml-auto sm:ml-0" />
          <span className="flex items-center gap-2 text-sm font-medium text-[#1a1a1a]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0033A0]/10 text-[#0033A0]">
              <Icon name="user" size={16} />
            </span>
            <span className="hidden sm:block">Admin User</span>
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}