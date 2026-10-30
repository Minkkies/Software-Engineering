"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { parseExpertise, splitExpertise } from "./faculty-utils";

const MAX_TAGS = 3;

function Icon({ d, className = "h-3.5 w-3.5" }) {
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
            <path d={d} />
        </svg>
    );
}

const ICONS = {
    search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
    filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
    book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
    mail: "M4 6h16v12H4zM4 7l8 6 8-6",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
    pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z",
    link: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
};

function Avatar({ member }) {
    if (member.photo_url) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                src={member.photo_url}
                alt={member.full_name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
            />
        );
    }
    return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-5xl font-semibold text-slate-500">
            {member.full_name?.replace(/^(ผศ\.|รศ\.|ศ\.|ดร\.|อ\.)+\s*/g, "").charAt(0)}
        </div>
    );
}

function FacultyCard({ member }) {
    const tags = parseExpertise(member.expertise);
    const shown = tags.slice(0, MAX_TAGS);
    const extra = tags.length - shown.length;

    return (
        <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
            <div className="aspect-[4/4.6] w-full overflow-hidden bg-gray-100">
                <Avatar member={member} />
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-lg font-bold text-[#1a1a1a]">{member.full_name}</h3>
                {member.position && (
                    <p className="text-sm font-medium text-[#0033a0]">{member.position}</p>
                )}

                {member.education && (
                    <p className="flex items-start gap-2 text-xs text-gray-500">
                        <Icon d={ICONS.book} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{member.education}</span>
                    </p>
                )}

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {shown.map((t) => {
                            const { code, name } = splitExpertise(t);
                            return (
                                <span
                                    key={t}
                                    title={t}
                                    className="max-w-full truncate rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
                                >
                                    {code || name}
                                </span>
                            );
                        })}
                        {extra > 0 && (
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                                +{extra}
                            </span>
                        )}
                    </div>
                )}

                <hr className="my-1 border-gray-200" />

                <ul className="space-y-1.5 text-xs text-gray-600">
                    {member.email && (
                        <li className="flex items-center gap-2">
                            <Icon d={ICONS.mail} className="h-3.5 w-3.5 shrink-0 text-[#0033a0]" />
                            <span className="truncate">{member.email}</span>
                        </li>
                    )}
                    {member.phone && (
                        <li className="flex items-center gap-2">
                            <Icon d={ICONS.phone} className="h-3.5 w-3.5 shrink-0 text-[#0033a0]" />
                            <span>{member.phone}</span>
                        </li>
                    )}
                    {member.office_room && (
                        <li className="flex items-center gap-2">
                            <Icon d={ICONS.pin} className="h-3.5 w-3.5 shrink-0 text-[#0033a0]" />
                            <span>{member.office_room}</span>
                        </li>
                    )}
                </ul>

                <Link
                    href={`/FacultyDirectory/${member.id}`}
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-[#1a1a1a] transition hover:bg-gray-50"
                >
                    ดูข้อมูลเพิ่มเติม
                    <Icon d={ICONS.link} className="h-3.5 w-3.5" />
                </Link>
            </div>
        </article>
    );
}

// ลำดับความสำคัญของตำแหน่ง: ยิ่งน้อยยิ่งขึ้นก่อน
function positionRank(member) {
    const pos = (member.position ?? "").trim();
    // ต้องเช็ก "รองหัวหน้า" ก่อน เพราะข้อความมีคำว่า "หัวหน้า" อยู่ข้างใน
    if (pos.startsWith("รองหัวหน้า")) return 2;
    if (pos.startsWith("หัวหน้าภาค")) return 1;
    return 99;
}

export default function FacultyClient({ members = [] }) {
    const [kind, setKind] = useState("teacher");
    const [query, setQuery] = useState("");
    const [expertise, setExpertise] = useState("");
    const [sort, setSort] = useState("th-asc");

    const ofKind = useMemo(() => members.filter((m) => m.kind === kind), [members, kind]);

    // ความเชี่ยวชาญทั้งหมด (เรียงตามจำนวนที่พบมากสุดก่อน) ใช้ทำ dropdown + ป้ายยอดนิยม
    const expertiseStats = useMemo(() => {
        const map = new Map();
        members.forEach((m) =>
            parseExpertise(m.expertise).forEach((t) => map.set(t, (map.get(t) ?? 0) + 1))
        );
        return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
    }, [members]);

    const popular = expertiseStats.slice(0, 5);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = ofKind.filter((m) => {
            const tags = parseExpertise(m.expertise);
            if (expertise && !tags.includes(expertise)) return false;
            if (!q) return true;
            return (
                m.full_name?.toLowerCase().includes(q) ||
                m.expertise?.toLowerCase().includes(q)
            );
        });

        if (sort === "th-asc")
            list.sort((a, b) => a.full_name.localeCompare(b.full_name, "th"));
        else if (sort === "th-desc")
            list.sort((a, b) => b.full_name.localeCompare(a.full_name, "th"));
        // sort === "default" -> คงลำดับ sort_order จากฐานข้อมูล
        list.sort((a, b) => positionRank(a) - positionRank(b));
        return list;
    }, [ofKind, query, expertise, sort]);

    const heading = kind === "teacher" ? "อาจารย์ประจำภาควิชา" : "เจ้าหน้าที่ / บุคลากร";

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F6F8]">
            {/* Banner */}
            <section className="bg-[#0033a0] text-white">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                    <h1 className="text-3xl font-bold sm:text-4xl">คณาจารย์และบุคลากร</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100">
                        ทำความรู้จักกับคณาจารย์ผู้ทรงคุณวุฒิและบุคลากรสายสนับสนุนของภาควิชาวิทยาการคอมพิวเตอร์
                        เรามุ่งมั่นในการสร้างสรรค์นวัตกรรมและการเรียนการสอนที่มีคุณภาพระดับสากล
                    </p>
                </div>
            </section>

            {/* Search + filters */}
            <section className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative flex-1">
                            <Icon
                                d={ICONS.search}
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="ค้นหาชื่ออาจารย์ หรือความเชี่ยวชาญ..."
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0033a0] focus:bg-white"
                            />
                        </label>

                        <label className="relative sm:w-64">
                            <Icon
                                d={ICONS.filter}
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                            />
                            <select
                                value={expertise}
                                onChange={(e) => setExpertise(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0033a0]"
                            >
                                <option value="">ความเชี่ยวชาญทั้งหมด</option>
                                {expertiseStats.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {popular.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-gray-500">ยอดนิยม:</span>
                            <button
                                type="button"
                                onClick={() => setExpertise("")}
                                className={`rounded-full border px-3 py-1 transition ${
                                    expertise === ""
                                        ? "border-[#0033a0] bg-[#0033a0] text-white"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                ทั้งหมด
                            </button>
                            {popular.map((t) => {
                                const active = expertise === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        title={t}
                                        onClick={() => setExpertise(active ? "" : t)}
                                        className={`rounded-full border px-3 py-1 transition ${
                                            active
                                                ? "border-[#0033a0] bg-[#0033a0] text-white"
                                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        {splitExpertise(t).code || t}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* List */}
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <h2 className="border-l-4 border-[#0033a0] pl-3 text-lg font-bold text-[#1a1a1a]">
                            {heading} ({visible.length})
                        </h2>
                        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs">
                            {[
                                ["teacher", "อาจารย์"],
                                ["staff", "บุคลากร"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setKind(value)}
                                    className={`rounded-md px-3 py-1.5 font-medium transition ${
                                        kind === value
                                            ? "bg-[#0033a0] text-white"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-gray-500">
                        จัดเรียงตาม:
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#0033a0]"
                        >
                            <option value="th-asc">ก - ฮ</option>
                            <option value="th-desc">ฮ - ก</option>
                            <option value="default">ลำดับที่กำหนด</option>
                        </select>
                    </label>
                </div>

                {visible.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
                        ไม่พบข้อมูลที่ตรงกับการค้นหา
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {visible.map((m) => (
                            <FacultyCard key={m.id} member={m} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
