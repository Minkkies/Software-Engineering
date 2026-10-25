"use client";
// app/(backend)/Admin/news/NewsClient.jsx
// หน้าจัดการข่าวสารและกิจกรรม: การ์ดสถิติ, ค้นหา/กรอง/เรียง, ตาราง, แบ่งหน้า,
// เพิ่ม/แก้ไข (AddNewForm), ลบ (ยืนยัน), จัดเก็บถาวร

import { useEffect, useMemo, useState } from "react";
import Button from "@components/button";
import Icon from "@components/IconComponent";
import AddNewForm from "./AddNewForm";

const PAGE_SIZE = 5;

const STATUS = {
  published: { label: "เผยแพร่แล้ว", cls: "bg-green-50 text-green-700", icon: "check" },
  draft: { label: "ฉบับร่าง", cls: "bg-amber-50 text-amber-700", icon: "clock" },
  archived: { label: "เก็บถาวร", cls: "bg-gray-100 text-gray-600", icon: "file" },
};

const SORTS = {
  newest: { label: "วันที่ใหม่สุด", fn: (a, b) => b.publishAt.localeCompare(a.publishAt) },
  oldest: { label: "วันที่เก่าสุด", fn: (a, b) => a.publishAt.localeCompare(b.publishAt) },
  views: { label: "เข้าชมมากสุด", fn: (a, b) => b.views - a.views },
};

const selectCls =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20";

// เวลาไทยปัจจุบันในรูป "YYYY-MM-DDTHH:mm" ไว้เทียบกับวันหมดอายุ
const nowThai = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16);

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

// รายการเลขหน้า เช่น [1, "…", 4, 5, 6, "…", 26]
function pageList(total, cur) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

function StatCard({ label, value, icon, tone }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-[#1a1a1a]">{value}</p>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>
        <Icon name={icon} size={20} />
      </span>
    </div>
  );
}

export default function NewsClient({ initialNews = [], initialCategories = [], readOnly = false }) {
  const [news, setNews] = useState(initialNews);
  const [categories, setCategories] = useState(initialCategories);
  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catError, setCatError] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // record | null
  const [deleting, setDeleting] = useState(null); // record | null
  const [toast, setToast] = useState("");

  // toast หายเองใน 3 วินาที
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- สถิติ ----------
  const stats = useMemo(
    () => ({
      total: news.length,
      published: news.filter((n) => n.status === "published").length,
      draft: news.filter((n) => n.status === "draft").length,
      views: news.reduce((s, n) => s + n.views, 0),
    }),
    [news]
  );

  // ---------- กรอง / เรียง / แบ่งหน้า ----------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return news
      .filter((n) => (category === "all" ? true : n.category === category))
      .filter((n) => (status === "all" ? true : n.status === status))
      .filter((n) => (q ? `${n.title} ${n.id} ${n.author}`.toLowerCase().includes(q) : true))
      .sort(SORTS[sort].fn);
  }, [news, search, category, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const onFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  // ---------- การกระทำ ----------
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSaved = (data) => {
    if (editing) {
      setNews((list) => list.map((n) => (n.id === editing.id ? { ...n, ...data } : n)));
      setToast("บันทึกการแก้ไขแล้ว");
    } else {
      const next =
        data.id ??
        `NW-${String(
          Math.max(0, ...news.map((n) => parseInt(n.id.replace(/\D/g, ""), 10) || 0)) + 1
        ).padStart(3, "0")}`;
      setNews((list) => [{ views: 0, author: "Admin User", ...data, id: next }, ...list]);
      setToast(data.status === "published" ? "เผยแพร่ข่าวสารแล้ว" : "บันทึกเป็นฉบับร่างแล้ว");
      setPage(1);
    }
    closeForm();
  };

  // เรียก API แล้วโยน Error พร้อมข้อความจากเซิร์ฟเวอร์ถ้าไม่สำเร็จ
  const callApi = async (url, method, body) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `เซิร์ฟเวอร์ตอบกลับ ${res.status}`);
    return json;
  };

  const toggleArchive = async (record) => {
    const nextStatus = record.status === "archived" ? "draft" : "archived";
    try {
      await callApi("/api/news", "PATCH", { id: record.id, status: nextStatus });
      setNews((list) => list.map((n) => (n.id === record.id ? { ...n, status: nextStatus } : n)));
      setToast(nextStatus === "archived" ? "จัดเก็บข่าวแล้ว" : "นำออกจากที่เก็บถาวรแล้ว (เป็นฉบับร่าง)");
    } catch (err) {
      setToast(`ทำรายการไม่สำเร็จ: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    try {
      await callApi("/api/news", "DELETE", { id: deleting.id });
      setNews((list) => list.filter((n) => n.id !== deleting.id));
      setToast("ลบข่าวสารแล้ว");
    } catch (err) {
      setToast(`ลบไม่สำเร็จ: ${err.message}`);
    }
    setDeleting(null);
  };

  const closeCat = () => {
    setCatOpen(false);
    setCatName("");
    setCatError("");
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return setCatError("กรุณากรอกชื่อหมวดหมู่");
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase()))
      return setCatError("มีหมวดหมู่นี้อยู่แล้ว");
    try {
      const saved = await callApi("/api/news/categories", "POST", { name });
      setCategories((list) => [...list, saved.name]);
      setCatName("");
      setCatError("");
      setToast(`เพิ่มหมวดหมู่ "${saved.name}" แล้ว`);
    } catch (err) {
      setCatError(err.message);
    }
  };

  const deleteCategory = async (name) => {
    try {
      await callApi("/api/news/categories", "DELETE", { name });
      setCategories((list) => list.filter((categoryName) => categoryName !== name));
      if (category === name) setCategory("all");
      setToast(`ลบหมวดหมู่ "${name}" แล้ว`);
      setDeletingCategory(null);
    } catch (err) {
      setCatError(`ลบไม่สำเร็จ: ${err.message}`);
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      {/* หัวหน้า */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">จัดการข่าวสารและกิจกรรม</h1>
          <p className="mt-1 text-sm text-gray-500">
            สร้าง แก้ไข และจัดการบทความข่าวสารทั้งหมดบนเว็บไซต์สาขา
          </p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" icon="plus" onClick={() => setCatOpen(true)}>
              เพิ่มหมวดหมู่ข่าวสาร
            </Button>
            <Button icon="plus" onClick={openCreate}>
              เพิ่มข่าวสารใหม่
            </Button>
          </div>
        )}
      </div>

      {/* สถิติ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ข่าวสารทั้งหมด" value={stats.total} icon="file" tone="bg-[#0033A0]/10 text-[#0033A0]" />
        <StatCard label="เผยแพร่แล้ว" value={stats.published} icon="check" tone="bg-green-100 text-green-600" />
        <StatCard label="ฉบับร่าง" value={stats.draft} icon="clock" tone="bg-amber-100 text-amber-600" />
        <StatCard label="ยอดการเข้าชมรวม" value={compact(stats.views)} icon="eye" tone="bg-yellow-100 text-yellow-600" />
      </div>

      {/* ตาราง */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* แถบเครื่องมือ */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={onFilter(setSearch)}
              placeholder="ค้นหาชื่อข่าวสาร..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-[#F5F6F8] pl-9 pr-3 text-sm outline-none focus:border-[#0033A0] focus:bg-white focus:ring-2 focus:ring-[#0033A0]/20"
            />
          </div>
          <select value={category} onChange={onFilter(setCategory)} className={selectCls} aria-label="หมวดหมู่">
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={status} onChange={onFilter(setStatus)} className={selectCls} aria-label="สถานะ">
            <option value="all">ทุกสถานะ</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select value={sort} onChange={onFilter(setSort)} className={selectCls} aria-label="เรียงตาม">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                เรียงตาม: {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 font-medium">หัวข้อข่าว</th>
                <th className="px-3 py-3 font-medium">หมวดหมู่</th>
                <th className="px-3 py-3 font-medium">ผู้เขียน</th>
                <th className="px-3 py-3 font-medium">วันที่เผยแพร่</th>
                <th className="px-3 py-3 font-medium">สถานะ</th>
                <th className="px-3 py-3 text-right font-medium">เข้าชม</th>
                <th className="px-5 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-gray-500">
                    ไม่พบข่าวสารที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
              {rows.map((n) => {
                const st = STATUS[n.status];
                return (
                  <tr key={n.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {n.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.coverUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                            <Icon name="image" size={20} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 max-w-sm font-semibold text-[#1a1a1a]">
                            {n.pinned && <span className="mr-1 text-[#d99a00]">📌</span>}
                            {n.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                            ID: {n.id.slice(0, 8)}
                            {n.documents?.length > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Icon name="file" size={11} />
                                {n.documents.length}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-gray-600">{n.category}</td>
                    <td className="px-3 py-3.5 text-gray-600">{n.author}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs text-gray-600">
                      {n.publishAt.slice(0, 10)}
                      {n.expireAt && (
                        <p
                          className={`mt-0.5 text-[11px] ${
                            n.expireAt <= nowThai() ? "text-red-600" : "text-gray-400"
                          }`}
                        >
                          {n.expireAt <= nowThai() ? "หมดอายุแล้ว " : "หมดอายุ "}
                          {n.expireAt.slice(0, 10)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}
                      >
                        <Icon name={st.icon} size={12} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono text-gray-700">
                      {n.views.toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-0.5">
                        {!readOnly && (
                          <>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="edit"
                          aria-label={`แก้ไข ${n.title}`}
                          onClick={() => openEdit(n)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="file"
                          aria-label={n.status === "archived" ? "นำออกจากที่เก็บถาวร" : "จัดเก็บถาวร"}
                          title={n.status === "archived" ? "นำออกจากที่เก็บถาวร" : "จัดเก็บถาวร"}
                          onClick={() => toggleArchive(n)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="trash"
                          aria-label={`ลบ ${n.title}`}
                          onClick={() => setDeleting(n)}
                          className="hover:text-red-600"
                        />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* แบ่งหน้า */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4 text-sm text-gray-500">
          <p>
            {filtered.length === 0
              ? "แสดง 0 รายการ"
              : `แสดง ${start + 1}-${start + rows.length} จาก ${filtered.length} รายการ`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              icon="chevronLeft"
              disabled={cur === 1}
              onClick={() => setPage(cur - 1)}
            >
              ก่อนหน้า
            </Button>
            {pageList(pages, cur).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-1.5">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === cur ? "page" : undefined}
                  className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                    p === cur
                      ? "bg-[#FFC72C] text-[#1a1a1a]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              iconRight="chevronRight"
              disabled={cur === pages}
              onClick={() => setPage(cur + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </section>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      {formOpen && (
        <AddNewForm
          key={editing?.id ?? "new"}
          initial={editing}
          categories={categories}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {/* ยืนยันการลบ */}
      {deleting && (
        <div
          className="fixed bottom-0 left-0 right-0 top-16 z-30 flex items-center justify-center bg-black/50 p-4 lg:left-64"
          onMouseDown={(e) => e.target === e.currentTarget && setDeleting(null)}
        >
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Icon name="alert" size={24} />
            </div>
            <h2 className="text-center text-lg font-bold text-[#1a1a1a]">ยืนยันการลบข่าวสาร?</h2>
            <p className="mt-1 text-center text-sm text-gray-500">การดำเนินการนี้ไม่สามารถย้อนคืนได้</p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-[11px] text-gray-400">ID: {deleting.id.slice(0, 8)}</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{deleting.title}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                ยกเลิก
              </Button>
              <Button variant="danger" icon="trash" onClick={confirmDelete}>
                ยืนยันการลบ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* เพิ่มหมวดหมู่ข่าวสาร */}
      {catOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 top-16 z-30 flex items-center justify-center bg-black/50 p-4 lg:left-64"
          onMouseDown={(e) => e.target === e.currentTarget && closeCat()}
        >
          <form
            onSubmit={addCategory}
            role="dialog"
            aria-modal="true"
            aria-label="เพิ่มหมวดหมู่ข่าวสาร"
            className="flex max-h-full w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-lg font-bold text-[#1a1a1a]">เพิ่มหมวดหมู่ข่าวสาร</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon="x"
                iconSize={20}
                aria-label="ปิด"
                onClick={closeCat}
              />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#1a1a1a]">
                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  value={catName}
                  maxLength={40}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    setCatError("");
                  }}
                  placeholder="เช่น ฝึกงานและสหกิจศึกษา"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-[#F5F6F8] px-3 text-sm outline-none focus:border-[#0033A0] focus:bg-white focus:ring-2 focus:ring-[#0033A0]/20"
                />
                {catError && <p className="mt-1.5 text-xs text-red-600">{catError}</p>}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#1a1a1a]">
                  หมวดหมู่ที่มีอยู่ ({categories.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-700"
                    >
                      <span>
                        {c}{" "}
                        <span className="text-gray-400">
                        · {news.filter((n) => n.category === c).length}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="rounded-full p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                        aria-label={`ลบหมวดหมู่ ${c}`}
                        onClick={() => setDeletingCategory(c)}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-3">
              <Button type="button" variant="ghost" onClick={closeCat}>
                ปิด
              </Button>
              <Button type="submit" icon="plus">
                เพิ่มหมวดหมู่
              </Button>
            </div>
          </form>
        </div>
      )}

      {deletingCategory && (
        <div
          className="fixed bottom-0 left-0 right-0 top-16 z-40 flex items-center justify-center bg-black/50 p-4 lg:left-64"
          onMouseDown={(e) => e.target === e.currentTarget && setDeletingCategory(null)}
        >
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Icon name="alert" size={24} />
            </div>
            <h2 className="text-center text-lg font-bold text-[#1a1a1a]">ยืนยันการลบหมวดหมู่?</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              หากลบหมวดหมู่นี้ ข่าวที่อยู่ในหมวดหมู่จะไม่มีหมวดหมู่
            </p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-sm font-semibold text-[#1a1a1a]">{deletingCategory}</p>
              <p className="mt-1 text-xs text-gray-500">
                ข่าวที่ได้รับผลกระทบ {news.filter((n) => n.category === deletingCategory).length} รายการ
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setDeletingCategory(null)}>
                ยกเลิก
              </Button>
              <Button variant="danger" icon="trash" onClick={() => deleteCategory(deletingCategory)}>
                ยืนยันการลบ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* แจ้งผลการทำงาน */}
      {toast && (
        <div
          role="status"
          className="fixed right-4 top-20 z-[60] flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}