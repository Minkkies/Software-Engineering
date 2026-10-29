"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const LIST_PAGE_SIZE = 5;
const GRID_PAGE_SIZE = 6;
const FALLBACK_AUTHOR = "เจ้าหน้าที่ภาควิชา";

/* ------------------------------------------------------------------ */
/* ตัวช่วย                                                              */
/* ------------------------------------------------------------------ */

function Icon({ children, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function formatThaiDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* ส่วนประกอบย่อย                                                        */
/* ------------------------------------------------------------------ */

function Meta({ item }) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5">
          <path d="M8 3v4m8-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </Icon>
        {formatThaiDate(item.date)}
      </span>
      <span aria-hidden="true">•</span>
      <span className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </Icon>
        {item.readMinutes} นาที
      </span>
    </div>
  );
}

function Cover({ item, className }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-100 to-slate-200 ${className}`}
    >
      {item.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      )}
      {item.categoryName && (
        <span className="absolute left-3 top-3 rounded bg-blue-800 px-2.5 py-1 text-[11px] font-semibold text-white">
          {item.categoryName}
        </span>
      )}
    </div>
  );
}

function Author({ name }) {
  const label = name || FALLBACK_AUTHOR;
  return (
    <span className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
      <span className="truncate">เผยแพร่โดย: {label}</span>
    </span>
  );
}

function ReadMore() {
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-800">
      อ่านเพิ่มเติม
      <Icon>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </Icon>
    </span>
  );
}

function NewsListCard({ item }) {
  return (
    <Link
      href={`/news/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md sm:flex-row"
    >
      <Cover item={item} className="h-48 w-full sm:h-auto sm:min-h-[10rem] sm:w-64" />
      <div className="flex flex-1 flex-col p-5">
        <Meta item={item} />
        <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
          {item.title}
        </h2>
        {item.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.summary}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <Author name={item.authorName} />
          <ReadMore />
        </div>
      </div>
    </Link>
  );
}

function NewsGridCard({ item }) {
  return (
    <Link
      href={`/news/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <Cover item={item} className="h-44 w-full" />
      <div className="flex flex-1 flex-col p-5">
        <Meta item={item} />
        <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-slate-900">
          {item.title}
        </h2>
        {item.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.summary}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <Author name={item.authorName} />
          <ReadMore />
        </div>
      </div>
    </Link>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const base =
    "flex h-8 min-w-8 items-center justify-center rounded-md border text-xs font-medium transition";

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="เปลี่ยนหน้า">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="หน้าก่อนหน้า"
        className={`${base} border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Icon className="h-3.5 w-3.5">
          <path d="m15 6-6 6 6 6" />
        </Icon>
      </button>

      {getPageNumbers(page, totalPages).map((p) =>
        typeof p === "string" ? (
          <span key={p} className="px-1 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${
              p === page
                ? "border-blue-800 bg-blue-800 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="หน้าถัดไป"
        className={`${base} border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Icon className="h-3.5 w-3.5">
          <path d="m9 6 6 6-6 6" />
        </Icon>
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* หน้าหลัก                                                              */
/* ------------------------------------------------------------------ */

export default function NewsClient({ news = [], categories = [] }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list"); // 'list' | 'grid'
  const [page, setPage] = useState(1);

  const pageSize = view === "list" ? LIST_PAGE_SIZE : GRID_PAGE_SIZE;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news
      .filter((n) => activeCat === "all" || n.categoryId === activeCat)
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          (n.summary ?? "").toLowerCase().includes(q) ||
          (n.categoryName ?? "").toLowerCase().includes(q)
      );
  }, [news, activeCat, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // กลับไปหน้า 1 เมื่อเปลี่ยนตัวกรอง/คำค้น/รูปแบบการแสดงผล
  useEffect(() => {
    setPage(1);
  }, [activeCat, query, view]);

  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chipClass = (active) =>
    `shrink-0 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
      active ? "bg-blue-800 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  const toggleClass = (active) =>
    `flex h-8 w-8 items-center justify-center rounded-md transition ${
      active ? "bg-blue-50 text-blue-800" : "text-slate-400 hover:text-slate-600"
    }`;

  return (
    <main className="min-h-screen bg-[#F5F6F8] pb-16">
      {/* ---------- Header ---------- */}
      <header className="bg-blue-800 px-4 pb-20 pt-10 text-center text-white">
        <span className="inline-block rounded-full border border-white/40 px-3 py-0.5 text-[11px] font-medium">
          News &amp; Updates
        </span>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
          ศูนย์รวมข่าวสารและกิจกรรม
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
          ติดตามข่าวสารความเคลื่อนไหว กิจกรรมทางวิชาการ และประกาศสำคัญต่าง ๆ
          <br className="hidden sm:block" />
          ของสาขาวิทยาการคอมพิวเตอร์
        </p>
      </header>

      <div className="mx-auto -mt-10 max-w-4xl px-4">
        {/* ---------- Toolbar ---------- */}
        <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-md md:flex-row md:items-center">
          <label className="relative md:w-60 md:shrink-0">
            <span className="sr-only">ค้นหาข่าว</span>
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </Icon>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาข่าว..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:justify-end">
            <button
              type="button"
              onClick={() => setActiveCat("all")}
              className={chipClass(activeCat === "all")}
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={chipClass(activeCat === c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 self-end border-slate-200 md:border-l md:pl-3">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="แสดงแบบตาราง"
              aria-pressed={view === "grid"}
              className={toggleClass(view === "grid")}
            >
              <Icon>
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </Icon>
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="แสดงแบบรายการ"
              aria-pressed={view === "list"}
              className={toggleClass(view === "list")}
            >
              <Icon>
                <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
              </Icon>
            </button>
          </div>
        </div>

        {/* ---------- News ---------- */}
        {visible.length > 0 ? (
          view === "list" ? (
            <div className="mt-6 flex flex-col gap-5">
              {visible.map((item) => (
                <NewsListCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {visible.map((item) => (
                <NewsGridCard key={item.id} item={item} />
              ))}
            </div>
          )
        ) : (
          <p className="mt-6 rounded-xl bg-white p-12 text-center text-slate-400 shadow-sm">
            ไม่พบข่าวที่ตรงกับเงื่อนไข
          </p>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} />
      </div>
    </main>
  );
}
