"use client";

import { useState } from "react";
import Link from "next/link";
import Icon, { iconNames } from "@components/IconComponent";

export default function IconExamplesPage() {
  const [iconSize, setIconSize] = useState(24);
  const [stroke, setStroke] = useState(2);

  return (
    <main className="min-h-screen bg-[#F5F6F8] p-4 sm:p-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              ตัวอย่างไอคอน
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ตัวอย่างไอคอนทั้งหมดที่ใช้ในระบบ
            </p>
          </div>
          <Link
            href="/home"
            className="rounded-lg border border-[#0033A0]/30 px-4 py-2 text-sm font-semibold text-[#0033A0]"
          >
            กลับหน้าแรก
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-gray-600">
            size: <b className="text-[#0033A0]">{iconSize}px</b>
            <input
              type="range"
              min={12}
              max={64}
              value={iconSize}
              onChange={(event) => setIconSize(Number(event.target.value))}
              className="mt-2 block w-full accent-[#0033A0]"
            />
          </label>
          <label className="text-sm text-gray-600">
            strokeWidth: <b className="text-[#0033A0]">{stroke}</b>
            <input
              type="range"
              min={1}
              max={3}
              step={0.25}
              value={stroke}
              onChange={(event) => setStroke(Number(event.target.value))}
              className="mt-2 block w-full accent-[#0033A0]"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {iconNames.map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-4 text-[#0033A0]"
            >
              <Icon name={name} size={iconSize} strokeWidth={stroke} />
              <span className="text-[11px] text-gray-500">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
