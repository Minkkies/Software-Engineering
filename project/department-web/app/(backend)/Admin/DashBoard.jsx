"use client";
// app/(backend)/Admin/DashBoard.jsx  (เรียกใช้จาก Admin/page.js)
// หน้าภาพรวมระบบ (Dashboard) ตามแบบ Visily: การ์ดสถิติ, กราฟแนวโน้ม, Quick Actions,
// รายชื่อบุคลากร และตารางข่าวล่าสุด

import Link from "next/link";
import Button from "@components/button";
import Icon from "@components/IconComponent";
import { ADMIN_BASE } from "@components/sidebar";
import { downloadCsv } from "@components/DataTable";

const QUICK_ACTIONS = [
  { label: "เขียนข่าวใหม่", sub: "เผยแพร่สู่เว็บไซต์", icon: "plus", href: "/Admin/news" },
  { label: "เพิ่มกิจกรรม", sub: "ปฏิทินวิชาการ", icon: "calendar", href: "/Admin/calender" },
  { label: "จัดการคณาจารย์", sub: "อัปเดตประวัติ", icon: "users", href: "/Admin/staff-teacher" }
];

const NEWS_STATUS = {
  published: { label: "เผยแพร่แล้ว", cls: "bg-green-50 text-green-700", icon: "check" },
  draft: { label: "ฉบับร่าง", cls: "bg-amber-50 text-amber-700", icon: "clock" },
  archived: { label: "จัดเก็บแล้ว", cls: "bg-gray-100 text-gray-600", icon: "file" },
};

function TrendBadge({ value }) {
  const up = value > 0;
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
      value === 0
        ? "bg-gray-100 text-gray-500"
        : up
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-600"
    }`}>
      {value === 0 ? "0% ไม่เปลี่ยนแปลง" : `${up ? "+" : ""}${value}%`}
    </span>
  );
}

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
      {pts.map(([x, y], index) => (
        <circle
          key={`${id}-${index}`}
          cx={x}
          cy={y}
          r="5"
          fill="white"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        >
          <title>{`${values[index].toLocaleString("en-US")} ครั้ง`}</title>
        </circle>
      ))}
    </>
  );
}

const initials = (name) => name.replace(/^(ศ\.|รศ\.|ผศ\.|ดร\.)+/g, "").trim().charAt(0);

function handleExport(stats, newsViews) {
  downloadCsv(
    "dashboard-statistics.csv",
    ["ประเภทข้อมูล", "รายการ", "ค่า", "แนวโน้มเทียบเดือนก่อน", "เดือน"],
    [
      ...stats.map((item) => [
        "สถิติ",
        item.label,
        item.value,
        `${item.trend}%`,
        "",
      ]),
      ...newsViews.map((item) => [
        "ยอดเข้าชมข่าวสาร",
        "จำนวนการเข้าชม",
        item.views,
        "",
        `${item.label} ${item.year}`,
      ]),
    ],
  );
}

// ---------- หน้า ----------
export default function DashBoard({ latestNews = [], newsViews = [], stats, staff = [] }) {
  const today = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const viewValues = newsViews.map((item) => item.views);
  const chartMax = Math.max(1, ...viewValues);
  const chartTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    value: Math.round(chartMax * ratio),
    y: 16 + (1 - ratio) * (CHART_H - 24),
  }));
  const dashboardStats = [
    { label: "จำนวนนักศึกษาทั้งหมด", value: stats?.students ?? 0, trend: stats?.trends?.students ?? 0, icon: "users" },
    { label: "ข่าวสารที่เผยแพร่", value: stats?.publishedNews ?? 0, trend: stats?.trends?.publishedNews ?? 0, icon: "news" },
    { label: "กิจกรรมในเดือนนี้", value: stats?.monthlyActivities ?? 0, trend: stats?.trends?.activities ?? 0, icon: "calendar" },
  ];

  return (
    <div className="w-full space-y-6 p-6">
      {/* หัวหน้า */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">ภาพรวมระบบ (Dashboard)</h1>
          <p className="mt-1 text-sm text-gray-500">
            ยินดีต้อนรับกลับมา, ผู้ดูแลระบบสารสนเทศ สาขาวิทยาการคอมพิวเตอร์
          </p>
        </div>
        <Button
          variant="outline"
          icon="download"
          onClick={() => handleExport(dashboardStats, newsViews)}
        >
          ส่งออก CSV
        </Button>
      </div>

      {/* การ์ดสถิติ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl border border-gray-200 border-b-4 border-b-[#FFC72C] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0033A0]/10 text-[#0033A0]">
                <Icon name={s.icon} size={22} />
              </span>
              <TrendBadge value={s.trend} />
            </div>
            <p className="mt-4 text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#1a1a1a]">
              {s.value.toLocaleString("en-US")}
            </p>
          </div>
        ))}
      </div>

      {/* กราฟ + Quick Actions / บุคลากร */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a]">ยอดเข้าชมข่าวสาร</h2>
              <p className="text-xs text-gray-500">
                จำนวนการเข้าชมข่าวสาร แยกตามเดือนที่สร้าง (6 เดือนล่าสุด)
              </p>
            </div>
            <span className="rounded-full bg-[#0033A0]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0033A0]">
              จากฐานข้อมูล
            </span>
          </div>

          <div className="mt-6">
            <svg
              viewBox={`-50 0 ${CHART_W + 50} ${CHART_H}`}
              preserveAspectRatio="none"
              className="h-60 w-full"
              role="img"
              aria-label="กราฟยอดเข้าชมข่าวสาร 6 เดือนล่าสุด"
            >
              {chartTicks.map((tick, index) => (
                <g key={index}>
                  <text
                    x="-8"
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {tick.value.toLocaleString("en-US")}
                  </text>
                  <line
                    x1="0"
                    x2={CHART_W}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="#e5e7eb"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}
              <AreaSeries
                values={viewValues}
                max={chartMax}
                color="#0033A0"
                id="g-news-views"
              />
            </svg>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              {newsViews.map((item) => (
                <span key={`${item.year}-${item.month}`}>{item.label}</span>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-5 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0033A0]" /> ยอดเข้าชมข่าวสาร
              </span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1a1a1a]">เข้าถึงด่วน (Quick Actions)</h2>
            <p className="text-xs text-gray-500">จัดการส่วนประกอบต่างๆ ของระบบได้ทันที</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a, index) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className={`group rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-[#0033A0]/40 hover:bg-[#0033A0]/5 ${index === QUICK_ACTIONS.length - 1 ? "col-span-2" : ""
                    }`}
                >
                  <Icon
                    name={a.icon}
                    size={20}
                    className={
                      a.icon === "calendar" || a.icon === "bell"
                        ? "text-[#d99a00]"
                        : "text-[#0033A0]"
                    }
                  />

                  <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">
                    {a.label}
                  </p>

                  <p className="text-[11px] text-gray-500">{a.sub}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* บุคลากร */}
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
              {staff.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="relative">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0033A0]/10 text-sm font-bold text-[#0033A0]">
                      {initials(p.name)}
                    </span>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                        p.active ? "bg-green-500" : "bg-gray-300"
                      }`}
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
            <Button size="sm" href={`${ADMIN_BASE}/news`}>
              ดูรายงานละเอียด
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
              {latestNews.map((n) => {
                const st = NEWS_STATUS[n.status];
                return (
                  <tr key={n.id} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#1a1a1a]">{n.title}</p>
                      <p className="text-[11px] text-gray-400">ID: {n.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-3 py-3.5 text-gray-600">{n.author}</td>
                    <td className="px-3 py-3.5 text-gray-600">
                      {new Date(n.date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}