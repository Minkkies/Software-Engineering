"use client";
// app/(backend)/Admin/DashBoard.jsx  (เรียกใช้จาก Admin/page.js)
// หน้าภาพรวมระบบ (Dashboard) ตามแบบ Visily: การ์ดสถิติ, กราฟแนวโน้ม, Quick Actions,
// รายชื่อบุคลากร, ตารางข่าวล่าสุด  (ข้อมูลด้านล่างเป็นตัวอย่าง ให้แทนด้วยข้อมูลจริงจาก API)

import Link from "next/link";
import Button from "@components/button";
import Icon from "@components/IconComponent";
import { ADMIN_BASE } from "@components/sidebar";

// ---------- ข้อมูลตัวอย่าง ----------
const STATS = [
  { label: "จำนวนนักศึกษาทั้งหมด", value: "1,248", trend: 12.5, icon: "users", bar: false },
  { label: "ข่าวสารที่เผยแพร่", value: "84", trend: 3.2, icon: "news", bar: true },
  { label: "หลักสูตรที่เปิดสอน", value: "12", trend: 0, icon: "book", bar: false },
  { label: "กิจกรรมในเดือนนี้", value: "28", trend: -4.1, icon: "calendar", bar: true },
];

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย."];
const VISITORS = [42, 50, 56, 52, 68, 82]; // ผู้เข้าชมระบบ
const CONTENT = [24, 22, 30, 28, 34, 40]; // การเข้าถึงเนื้อหา

const QUICK_ACTIONS = [
  { label: "เขียนข่าวใหม่", sub: "เผยแพร่สู่เว็บไซต์", icon: "plus", href: "/Admin/news" },
  { label: "เพิ่มกิจกรรม", sub: "ปฏิทินวิชาการ", icon: "calendar", href: "/Admin/calender" },
  { label: "จัดการคณาจารย์", sub: "อัปเดตประวัติ", icon: "users", href: "/Admin/staff-teacher" },
  { label: "แจ้งเตือนรวม", sub: "ส่งถึงนักศึกษา", icon: "bell", href: "#" }, // เปลี่ยนเมื่อมีหน้าแจ้งเตือน
];

const STAFF = [
  { name: "ศ.ดร.สมชาย ใจดี", role: "หัวหน้าภาควิชา", status: "online" },
  { name: "ผศ.รัตนากรณ์ แก้วนณี", role: "รองหัวหน้าภาควิชา", status: "away" },
  { name: "ดร.วิชัย มั่นคง", role: "อาจารย์ประจำ", status: "online" },
];

const NEWS = [
  { id: "CS-1", title: "ประกาศรับสมัครนักศึกษาใหม่ ปีการศึกษา 2567", author: "ศ.ดร.สมชาย ใจดี", date: "24 พ.ค. 2567", status: "published", views: 1240 },
  { id: "CS-2", title: "กิจกรรมค่ายคอมพิวเตอร์เพื่อเยาวชน ครั้งที่ 15", author: "ผศ.หญิง รัตนากรณ์", date: "22 พ.ค. 2567", status: "draft", views: 0 },
  { id: "CS-3", title: "ผลการแข่งขันเขียนโปรแกรมระดับประเทศ ACM-ICPC", author: "ดร.วิชัย นามสกุลดี", date: "20 พ.ค. 2567", status: "published", views: 850 },
  { id: "CS-4", title: "สัมมนาเทคโนโลยี AI และอนาคตของแรงงานไทย", author: "Admin", date: "18 พ.ค. 2567", status: "archived", views: 2100 },
  { id: "CS-5", title: "ตารางสอบปลายภาค ภาคเรียนที่ 2/2566", author: "ฝ่ายทะเบียน", date: "15 พ.ค. 2567", status: "published", views: 5420 },
];

const NEWS_STATUS = {
  published: { label: "เผยแพร่แล้ว", cls: "bg-green-50 text-green-700", icon: "check" },
  draft: { label: "ฉบับร่าง", cls: "bg-amber-50 text-amber-700", icon: "clock" },
  archived: { label: "จัดเก็บแล้ว", cls: "bg-gray-100 text-gray-600", icon: "file" },
};

const STAFF_DOT = { online: "bg-green-500", away: "bg-amber-400", offline: "bg-gray-300" };

// ---------- ตัวช่วยกราฟ ----------
const CHART_W = 600;
const CHART_H = 240;

function toPoints(values, max) {
  const top = 16;
  const usable = CHART_H - top - 8;
  return values.map((v, i) => [
    (i * CHART_W) / (values.length - 1),
    top + (1 - v / max) * usable,
  ]);
}

function smoothPath(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

function AreaSeries({ values, max, color, id }) {
  const pts = toPoints(values, max);
  const line = smoothPath(pts);
  const area = `${line} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function TrendBadge({ value }) {
  if (value === 0)
    return <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">0%</span>;
  const up = value > 0;
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
        up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? "↗ +" : "↘ "}
      {value}%
    </span>
  );
}

const initials = (name) => name.replace(/^(ศ\.|รศ\.|ผศ\.|ดร\.)+/g, "").trim().charAt(0);

// ---------- หน้า ----------
export default function DashBoard() {
  const today = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* หัวหน้า */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">ภาพรวมระบบ (Dashboard)</h1>
          <p className="mt-1 text-sm text-gray-500">
            ยินดีต้อนรับกลับมา, ผู้ดูแลระบบสารสนเทศ สาขาวิทยาการคอมพิวเตอร์
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-gray-500">วันที่ปัจจุบัน</p>
            <p className="text-sm font-medium text-[#1a1a1a]" suppressHydrationWarning>
              {today}
            </p>
          </div>
          <Button icon="plus">สร้างรายงานใหม่</Button>
        </div>
      </div>

      {/* การ์ดสถิติ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0033A0]/10 text-[#0033A0]">
                <Icon name={s.icon} size={22} />
              </span>
              <TrendBadge value={s.trend} />
            </div>
            <p className="mt-4 text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#1a1a1a]">{s.value}</p>
            {s.bar && <span className="absolute inset-x-0 bottom-0 h-1 bg-[#FFC72C]" />}
          </div>
        ))}
      </div>

      {/* กราฟ + Quick Actions / บุคลากร */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a]">แนวโน้มการเข้าใช้งานระบบ</h2>
              <p className="text-xs text-gray-500">
                ข้อมูลเปรียบเทียบระหว่างผู้เข้าชมและการเข้าถึงเนื้อหา (6 เดือนล่าสุด)
              </p>
            </div>
            <span className="rounded-full bg-[#0033A0]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0033A0]">
              Real-time
            </span>
          </div>

          <div className="mt-6">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              className="h-60 w-full"
              role="img"
              aria-label="กราฟแนวโน้มการเข้าใช้งานระบบ 6 เดือนล่าสุด"
            >
              {[0.25, 0.5, 0.75].map((r) => (
                <line
                  key={r}
                  x1="0"
                  x2={CHART_W}
                  y1={CHART_H * r}
                  y2={CHART_H * r}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <AreaSeries values={CONTENT} max={100} color="#FFC72C" id="g-content" />
              <AreaSeries values={VISITORS} max={100} color="#0033A0" id="g-visitors" />
            </svg>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              {MONTHS.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-5 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0033A0]" /> ผู้เข้าชมระบบ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#FFC72C]" /> การเข้าถึงเนื้อหา
              </span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1a1a1a]">เข้าถึงด่วน (Quick Actions)</h2>
            <p className="text-xs text-gray-500">จัดการส่วนประกอบต่างๆ ของระบบได้ทันที</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-[#0033A0]/40 hover:bg-[#0033A0]/5"
                >
                  <Icon
                    name={a.icon}
                    size={20}
                    className={a.icon === "calendar" || a.icon === "bell" ? "text-[#d99a00]" : "text-[#0033A0]"}
                  />
                  <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">{a.label}</p>
                  <p className="text-[11px] text-gray-500">{a.sub}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1a1a1a]">คณาจารย์และบุคลากร</h2>
                <p className="text-xs text-gray-500">สถานะการเชื่อมต่อปัจจุบัน</p>
              </div>
              <Link
                href={`${ADMIN_BASE}/staff-teacher`}
                className="text-xs font-medium text-[#0033A0] hover:underline"
              >
                ดูทั้งหมด
              </Link>
            </div>
            <ul className="mt-4 space-y-4">
              {STAFF.map((p) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="relative">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0033A0]/10 text-sm font-bold text-[#0033A0]">
                      {initials(p.name)}
                    </span>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${STAFF_DOT[p.status]}`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1a1a1a]">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* ข่าวสารล่าสุด */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">ข่าวสารล่าสุด</h2>
            <p className="text-xs text-gray-500">รายการข่าวสารที่สร้างล่าสุดและสถานะการแสดงผล</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" href={`${ADMIN_BASE}/news`}>
              ดูรายงานละเอียด
            </Button>
            <Button variant="accent" size="sm" icon="plus" href={`${ADMIN_BASE}/news`}>
              สร้างข่าวสาร
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-6 py-3 font-medium">หัวข้อข่าว</th>
                <th className="px-3 py-3 font-medium">ผู้เขียน</th>
                <th className="px-3 py-3 font-medium">วันที่สร้าง</th>
                <th className="px-3 py-3 font-medium">สถานะ</th>
                <th className="px-3 py-3 text-right font-medium">การเข้าชม</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {NEWS.map((n) => {
                const st = NEWS_STATUS[n.status];
                return (
                  <tr key={n.id} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#1a1a1a]">{n.title}</p>
                      <p className="text-[11px] text-gray-400">ID: #{n.id}</p>
                    </td>
                    <td className="px-3 py-3.5 text-gray-600">{n.author}</td>
                    <td className="px-3 py-3.5 text-gray-600">{n.date}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}
                      >
                        <Icon name={st.icon} size={12} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-gray-700">
                      {n.views.toLocaleString("en-US")}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="eye"
                        href={`${ADMIN_BASE}/news`}
                        aria-label={`ดูข่าว ${n.title}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ท้ายหน้า */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" /> ระบบกำลังทำงานปกติ (System Operational)
        </span>
        <span>เอกสารการใช้งาน · ศูนย์ช่วยเหลือ</span>
      </footer>
    </div>
  );
}