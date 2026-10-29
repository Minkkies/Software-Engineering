"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* ค่าคงที่                                                            */
/* ------------------------------------------------------------------ */

// รูปสไลด์: วางไฟล์ไว้ที่ public/images/home/
const HERO_SLIDES = [
  { src: "/images/home/home-img1.jpg", alt: "บรรยากาศห้องปฏิบัติการคอมพิวเตอร์" },
  { src: "/images/home/home-img2.jpg", alt: "กิจกรรมของนักศึกษาสาขาวิทยาการคอมพิวเตอร์" },
  { src: "/images/home/home-img3.jpg", alt: "การเรียนการสอนในสาขาวิทยาการคอมพิวเตอร์" },
];
const SLIDE_INTERVAL_MS = 3000;

const QUICK_LINKS = [
  {
    title: "ข่าวประชาสัมพันธ์",
    desc: "ติดตามข่าวสารใหม่ล่าสุด",
    href: "/news",
    color: "text-blue-700 bg-blue-50",
    icon: (
      <path d="M4 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 0 2-2V8h-2M8 7h6M8 11h6M8 15h4M4 5v12a2 2 0 0 0 2 2h12" />
    ),
  },
  {
    title: "ข้อมูลรายวิชา",
    desc: "ดาวน์โหลดสไลด์และชีท",
    href: "/course",
    color: "text-emerald-700 bg-emerald-50",
    icon: (
      <path d="M12 7c-1.5-1.5-4-2-8-2v13c4 0 6.5.5 8 2m0-13c1.5-1.5 4-2 8-2v13c-4 0-6.5.5-8 2m0-13v13" />
    ),
  },
  {
    title: "คณาจารย์ประจำภาควิชา",
    desc: "ข้อมูลและช่องทางติดต่ออาจารย์",
    href: "/FacultyDirectory",
    color: "text-violet-700 bg-violet-50",
    icon: (
      <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8v-1a4 4 0 0 0-3-3.87M16 4.13a3.5 3.5 0 0 1 0 6.74" />
    ),
  },
  {
    title: "ปฏิทินการศึกษาและกิจกรรม",
    desc: "ตรวจสอบกำหนดการต่าง ๆ",
    href: "/calender",
    color: "text-amber-700 bg-amber-50",
    icon: <path d="M8 3v4m8-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
  },
];

const MAX_NEWS_ON_HOME = 4;

/* ------------------------------------------------------------------ */
/* ตัวช่วยเล็ก ๆ                                                         */
/* ------------------------------------------------------------------ */

function Icon({ children, className = "h-6 w-6" }) {
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

/* ------------------------------------------------------------------ */
/* Hero + Carousel                                                     */
/* ------------------------------------------------------------------ */

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % HERO_SLIDES.length),
      SLIDE_INTERVAL_MS
    );
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="relative h-72 w-full overflow-hidden rounded-3xl bg-slate-200 shadow-lg sm:h-96 lg:h-[30rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="รูปภาพบรรยากาศสาขา"
    >
      {HERO_SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        />
      ))}

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`ไปยังรูปที่ ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <span className="inline-block rounded-full bg-yellow-300 px-4 py-1 text-xs font-semibold text-slate-800">
            ยินดีต้อนรับสู่ CS Info Portal
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            ระบบจัดการข่าวสารสารสนเทศ
            <span className="block text-blue-800">สาขาวิทยาการคอมพิวเตอร์</span>
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-slate-500">
            ศูนย์กลางข้อมูลข่าวสาร ผลงานทางวิชาการ
            <br className="hidden sm:block" />
            และการบริหารจัดการสำหรับนักศึกษาและคณาจารย์
            <br className="hidden sm:block" />
            เพื่อก้าวสู่ความเป็นเลิศทางด้านเทคโนโลยีสารสนเทศในระดับสากล
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
            >
              ดูประกาศล่าสุด
              <Icon className="h-4 w-4">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </Icon>
            </Link>
            <Link
              href="/course"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-800/40 bg-slate-50 px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
            >
              <Icon className="h-4 w-4">
                <path d="M12 7c-1.5-1.5-4-2-8-2v13c4 0 6.5.5 8 2m0-13c1.5-1.5 4-2 8-2v13c-4 0-6.5.5-8 2m0-13v13" />
              </Icon>
              หลักสูตรการศึกษา
            </Link>
          </div>
        </div>

        <HeroCarousel />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick access                                                        */
/* ------------------------------------------------------------------ */

function QuickAccess() {
  return (
    <section className="bg-slate-100">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color}`}
            >
              <Icon>{item.icon}</Icon>
            </span>
            <span>
              <span className="block font-bold text-slate-900">{item.title}</span>
              <span className="block text-sm text-slate-500">{item.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* News                                                                */
/* ------------------------------------------------------------------ */

function NewsCard({ item }) {
  return (
    <Link
      href={`/news/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-44 w-full bg-gradient-to-br from-blue-100 to-slate-200">
        {item.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {item.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
            {item.categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Icon className="h-3.5 w-3.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </Icon>
          {formatThaiDate(item.date)}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-slate-900">
          {item.title}
        </h3>
        {item.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.summary}</p>
        )}
        <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-blue-800">
          อ่านต่อ
          <Icon className="h-4 w-4">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </Icon>
        </span>
      </div>
    </Link>
  );
}

function NewsSection({ news, categories }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news
      .filter((n) => activeCat === "all" || n.categoryId === activeCat)
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          (n.summary ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_NEWS_ON_HOME);
  }, [news, activeCat, query]);

  const chipClass = (active) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-indigo-600 text-white shadow"
        : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
    }`;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">ข่าวสารล่าสุด</h2>
          <p className="mt-1 text-sm text-slate-500">
            อัปเดตกิจกรรมและความเคลื่อนไหวในสาขา
          </p>
        </div>
        <Link
          href="/news"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-800 hover:underline"
        >
          ดูข่าวทั้งหมด
          <Icon className="h-4 w-4">
            <path d="m9 6 6 6-6 6" />
          </Icon>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Icon className="h-4 w-4">
          <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />
        </Icon>
        กรองข่าว
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveCat("all")}
          className={chipClass(activeCat === "all")}
        >
          ดูข่าวทั้งหมด
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

        <label className="relative ml-auto w-full sm:w-60">
          <span className="sr-only">ค้นหาข่าว</span>
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </Icon>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาข่าวที่สนใจ..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl bg-white p-10 text-center text-slate-400 shadow-sm">
          ไม่พบข่าวที่ตรงกับเงื่อนไข
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calendar placeholder (รอทีมปฏิทินพัฒนา)                              */
/* ------------------------------------------------------------------ */

function CalendarPlaceholder() {
  return (
    <aside className="flex min-h-[32rem] flex-col overflow-hidden rounded-xl bg-white shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between bg-blue-800 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">ปฏิทินกิจกรรม</h2>
        <Icon className="h-5 w-5">
          <path d="M8 3v4m8-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </Icon>
      </div>

      {/* TODO: ใส่ปฏิทินและรายการกิจกรรมที่นี่ หลังทีมปฏิทินพัฒนาเสร็จ */}
      <div className="flex-1" />

      <div className="p-4">
        <Link
          href="/calender"
          className="block rounded-md bg-slate-100 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          ดูปฏิทินวิชาการทั้งหมด
        </Link>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomeClient({ news = [], categories = [] }) {
  return (
    <main>
      <Hero />
      <QuickAccess />

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <NewsSection news={news} categories={categories} />
          <CalendarPlaceholder />
        </div>
      </section>
    </main>
  );
}
