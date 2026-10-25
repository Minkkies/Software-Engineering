"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@components/button";

/**
 * ดาวน์โห   ดข้อมูลเป็น CSV (ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง)
 * @param {string} filename
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 */
export function downloadCsv(filename, headers, rows) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// สร้างรายการเลขหน้า เช่น 1 2 3 … 250 (ไม่แสดงทุกหน้าเมื่อมีจำนวนมาก)
function getPageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
    const sorted = [...set].sort((a, b) => a - b);
    const out = [];
    sorted.forEach((n, i) => {
        if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
        out.push(n);
    });
    return out;
}

const MENU_ITEM = "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50";

/**
 * DataTable — ตารางข้อมูลมาตรฐานของระบบหลังบ้าน
 *
 * Props
 * - title, description      หัวตาราง
 * - columns                 [{ key, header, render?(row), cellClassName?(string | row => string), headerClassName? }]
 * - data                    ข้อมูลทั้งหมด (กรอง/แบ่งหน้าในตัว component)
 * - loading                 แสดงข้อความกำลังโหลด
 * - getRowId                (row) => id   (ค่าเริ่มต้น row.id)
 * - searchText              (row) => string ที่ใช้ค้นหา (ค่าเริ่มต้น: รวมทุกค่าใน row)
 * - searchPlaceholder
 * - filters                 [{ key, allLabel?, options: [{ value, label }], match?(row, value) }]
 * - rowActions              (row) => [{ label, href?, onClick?, danger?, hidden? }]  -> เมนู ⋮
 * - actionsHeader           หัวคอลัมน์เมนู (ค่าเริ่มต้น "ดำเนินการ")
 * - toolbar                 node เพิ่มเติมในแถบเครื่องมือด้านขวาบน
 * - pageSize, emptyMessage, loadingMessage
 *
 * ref: { getFilteredRows() }  ใช้ดึงแถวที่ผ่านการค้นหา/กรองแล้ว (เช่น เพื่อส่งออก CSV)
 */
const DataTable = forwardRef(function DataTable(
    {
        title,
        description,
        columns,
        data,
        loading = false,
        getRowId = (row) => row.id,
        searchText = (row) => Object.values(row).join(" "),
        searchPlaceholder = "ค้นหา...",
        filters = [],
        rowActions,
        actionsHeader = "ดำเนินการ",
        toolbar,
        pageSize = 10,
        emptyMessage = "ไม่พบผลลัพธ์การค้นหา",
        loadingMessage = "กำลังโหลดข้อมูล...",
    },
    ref
) {
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState({});
    const [showFilter, setShowFilter] = useState(false);
    const [page, setPage] = useState(1);
    const [menu, setMenu] = useState(null); // { row, top?, bottom?, right }

    // ปิด popover ทั้งหมดเมื่อคลิกที่อื่น / scroll / resize
    useEffect(() => {
        const close = () => {
            setMenu(null);
            setShowFilter(false);
        };
        window.addEventListener("click", close);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", close, true);
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return data.filter((row) => {
            for (const f of filters) {
                const v = filterValues[f.key];
                if (!v || v === "all") continue;
                const ok = f.match ? f.match(row, v) : row[f.key] === v;
                if (!ok) return false;
            }
            return !q || String(searchText(row)).toLowerCase().includes(q);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, search, filterValues]);

    useImperativeHandle(ref, () => ({ getFilteredRows: () => filtered }), [filtered]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const colCount = columns.length + (rowActions ? 1 : 0);
    const activeFilterCount = Object.values(filterValues).filter((v) => v && v !== "all").length;

    function openMenu(e, row) {
        e.stopPropagation();
        if (menu?.row && getRowId(menu.row) === getRowId(row)) return setMenu(null);
        const rect = e.currentTarget.getBoundingClientRect();
        const estHeight = (rowActions(row).filter((a) => !a.hidden).length || 1) * 40 + 8;
        const flip = rect.bottom + estHeight > window.innerHeight;
        setShowFilter(false);
        setMenu({
            row,
            right: window.innerWidth - rect.right,
            ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        });
    }

    const menuActions = menu ? rowActions(menu.row).filter((a) => !a.hidden) : [];

    return (
        <section className="rounded-xl bg-white shadow-sm">
            {/* หัวตาราง + เครื่องมือ */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                    {title && <h2 className="text-xl font-bold text-[#1a1a1a]">{title}</h2>}
                    {description && <p className="text-xs text-gray-500">{description}</p>}
                </div>
                <div className="relative flex flex-wrap items-center gap-3">
                    {toolbar}
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder={searchPlaceholder}
                        className="w-64 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0A2FA3]"
                    />
                    {filters.length > 0 && (
                        <>
                            <Button
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenu(null);
                                    setShowFilter((v) => !v);
                                }}
                            >
                                {activeFilterCount ? `ตัวกรอง (${activeFilterCount})` : "ตัวกรอง"}
                            </Button>
                            {showFilter && (
                                <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-12 z-20 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                    {filters.map((f) => (
                                        <div key={f.key}>
                                            {[{ value: "all", label: f.allLabel ?? "ทั้งหมด" }, ...f.options].map((opt) => {
                                                const selected = (filterValues[f.key] ?? "all") === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setFilterValues((s) => ({ ...s, [f.key]: opt.value }));
                                                            setPage(1);
                                                            setShowFilter(false);
                                                        }}
                                                        className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected ? "font-semibold text-[#0A2FA3]" : "text-gray-700"}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ตาราง */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-y border-gray-200 bg-gray-50 text-xs text-gray-600">
                        <tr>
                            {columns.map((c) => (
                                <th key={c.key} className={`px-5 py-3 font-medium ${c.headerClassName ?? ""}`}>
                                    {c.header}
                                </th>
                            ))}
                            {rowActions && <th className="w-24 px-5 py-3 font-medium">{actionsHeader}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={colCount} className="px-5 py-10 text-center text-gray-400">{loadingMessage}</td>
                            </tr>
                        )}
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={colCount} className="px-5 py-10 text-center text-gray-500">{emptyMessage}</td>
                            </tr>
                        )}
                        {rows.map((row) => (
                            <tr key={getRowId(row)} className="border-b border-gray-100 hover:bg-gray-50/60">
                                {columns.map((c) => {
                                    const extra = typeof c.cellClassName === "function" ? c.cellClassName(row) : c.cellClassName;
                                    return (
                                        <td key={c.key} className={`px-5 py-3 ${extra ?? ""}`}>
                                            {c.render ? c.render(row) : row[c.key]}
                                        </td>
                                    );
                                })}
                                {rowActions && (
                                    <td className="px-5 py-3">
                                        <button
                                            type="button"
                                            aria-label="เมนูจัดการ"
                                            aria-haspopup="menu"
                                            onClick={(e) => openMenu(e, row)}
                                            className="rounded px-2 text-lg leading-none text-gray-600 hover:bg-gray-100"
                                        >
                                            ⋮
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* เมนู ⋮ (fixed เพื่อไม่ให้ถูกตัดด้วย overflow ของตาราง) */}
            {menu && (
                <div
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: menu.top, bottom: menu.bottom, right: menu.right }}
                    className="fixed z-30 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {menuActions.map((a) => {
                        const cls = `${MENU_ITEM} ${a.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`;
                        return a.href ? (
                            <Link key={a.label} href={a.href} role="menuitem" onClick={() => setMenu(null)} className={cls}>
                                {a.label}
                            </Link>
                        ) : (
                            <button
                                key={a.label}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setMenu(null);
                                    a.onClick?.();
                                }}
                                className={cls}
                            >
                                {a.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-gray-500">
                <span>
                    แสดง {rows.length} จากทั้งหมด {filtered.length.toLocaleString()} รายการ
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                        ก่อนหน้า
                    </button>
                    {getPageList(currentPage, totalPages).map((n, i) =>
                        n === "gap" ? (
                            <span key={`gap-${i}`} className="px-1">…</span>
                        ) : (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setPage(n)}
                                className={`h-8 w-8 rounded-lg ${n === currentPage ? "bg-amber-400 font-semibold text-[#1a1a1a]" : "text-gray-600 hover:bg-gray-100"}`}
                            >
                                {n}
                            </button>
                        )
                    )}
                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(currentPage + 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>
        </section>
    );
});

export default DataTable;
