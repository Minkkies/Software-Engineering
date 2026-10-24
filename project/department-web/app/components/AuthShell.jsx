"use client";

import Link from "next/link";

/* ---------- Icons (inline SVG, ไม่ต้องติดตั้งไลบรารี) ---------- */
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const Icon = {
  shield: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  check: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  ),
  help: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
    </svg>
  ),
  user: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  userPlus: (p) => (
    <svg {...base} {...p}>
      <circle cx="10" cy="8" r="4" />
      <path d="M2 21c0-4 4-6 8-6M19 8v6M16 11h6" />
    </svg>
  ),
  mail: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  lock: (p) => (
    <svg {...base} {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  idCard: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.5-1.5 5.5-1.5 6 0M14 10h4M14 14h4" />
    </svg>
  ),
  eye: (p) => (
    <svg {...base} {...p}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (p) => (
    <svg {...base} {...p}>
      <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.2 3.8M6.5 7.5C3.8 9.3 2 12 2 12s4 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 004.2 4.2" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

/* ---------- Layout หลัก: พื้นหลัง + การ์ดสองฝั่ง + แถบสถานะ ---------- */
export function AuthShell({ left, children }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-b from-[#E6EEF2] to-[#F5F6F8] px-4 py-10 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#DDE6EA]/70 to-transparent"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 md:grid-cols-2">
        {left}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">{children}</div>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          สถานะระบบ: ปกติ
        </span>
        <span className="hidden h-3 w-px bg-gray-300 sm:block" />
        <Link href="#" className="hover:text-[#0A3CA8]">นโยบายความปลอดภัย</Link>
        <Link href="#" className="hover:text-[#0A3CA8]">คำถามที่พบบ่อย</Link>
        <Link href="#" className="hover:text-[#0A3CA8]">แจ้งปัญหาการใช้งาน</Link>
      </div>
    </div>
  );
}

/* ---------- แผงสีน้ำเงินด้านซ้าย ---------- */
export function BluePanel({ title, highlight, description, items, footer, children }) {
  return (
    <div className="flex flex-col justify-between gap-8 bg-[#0A3CA8] p-8 text-white sm:p-10">
      <div className="flex flex-col gap-6">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium">
          <Icon.shield width={14} height={14} />
          ระบบความปลอดภัยสูง
        </span>

        <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
          {title}
          {highlight && <span className="block text-[#FFC42A]">{highlight}</span>}
        </h2>

        <p className="text-sm leading-relaxed text-white/80">{description}</p>

        <ul className="mt-2 flex flex-col gap-5">
          {items.map(({ icon: Ico, heading, text }) => (
            <li key={heading} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                <Ico />
              </span>
              <div>
                <p className="text-sm font-semibold">{heading}</p>
                <p className="text-xs leading-relaxed text-white/75">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {children}
      </div>

      <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/70">
        {footer}
      </div>
    </div>
  );
}

/* ---------- ช่องกรอกข้อมูล ---------- */
export function Field({ label, icon: Ico, action, className = "", ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="flex items-center justify-between text-sm font-medium text-[#1a1a1a]">
        {label}
        {action}
      </span>
      <span className="relative block">
        {Ico && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Ico width={16} height={16} />
          </span>
        )}
        <input
          {...props}
          className={`h-11 w-full rounded-lg border border-transparent bg-[#F3F4F6] pr-10 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:border-[#0A3CA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A3CA8]/20 ${
            Ico ? "pl-10" : "pl-3"
          }`}
        />
      </span>
    </label>
  );
}

export function PasswordField({ label = "รหัสผ่าน", show, onToggle, action, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-sm font-medium text-[#1a1a1a]">
        {label}
        {action}
      </span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon.lock width={16} height={16} />
        </span>
        <input
          {...props}
          type={show ? "text" : "password"}
          className="h-11 w-full rounded-lg border border-transparent bg-[#F3F4F6] pl-10 pr-10 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:border-[#0A3CA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A3CA8]/20"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <Icon.eyeOff width={16} height={16} /> : <Icon.eye width={16} height={16} />}
        </button>
      </span>
    </label>
  );
}

export function SubmitButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FFC42A] text-base font-bold text-[#1a1a1a] shadow-md transition hover:bg-[#f5b800] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A3CA8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
      <Icon.arrowRight width={18} height={18} />
    </button>
  );
}
