"use client";

import Link from "next/link";
import Button from "@components/button";

const VARIANTS = ["primary", "accent", "outline", "soft", "ghost", "danger"];
const SIZES = ["sm", "md", "lg"];

export default function ButtonExamplesPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8] p-4 sm:p-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            ตัวอย่าง Button
          </h1>
          <Link href="/home" className="text-sm font-semibold text-[#0033A0]">
            กลับหน้าแรก
          </Link>
        </div>

        <div className="space-y-5">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              <span className="w-10 text-xs font-medium text-gray-500">
                {size}
              </span>
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
            <Button icon="plus">เพิ่มข่าวสารใหม่</Button>
            <Button variant="outline" iconRight="arrowRight">
              ดูข่าวทั้งหมด
            </Button>
            <Button variant="danger" icon="trash">ลบ</Button>
            <Button variant="ghost" icon="bell" aria-label="แจ้งเตือน" />
            <Button disabled>ปิดใช้งาน</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
