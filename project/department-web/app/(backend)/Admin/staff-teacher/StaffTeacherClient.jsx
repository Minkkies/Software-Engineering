"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../../lib/supabase/client";
import Button from "@components/button";

const emptyForm = {
    full_name: "",
    kind: "teacher",
    position: "",
    education: "",
    expertise: "",
    research: "",
    email: "",
    phone: "",
    office_room: "",
    consult_hours: "",
    photo_url: "",
    is_active: true,
};

const fieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function Field({ label, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            {label}
            {children}
        </label>
    );
}

function Icon({ name, className = "h-4 w-4" }) {
    const paths = {
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
        edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" /></>,
        trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    };

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            {paths[name]}
        </svg>
    );
}

function errorMessage(error) {
    if (!error) return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    if (error.code === "42501" || /row-level security|permission denied/i.test(error.message || "")) {
        return "ไม่มีสิทธิ์ดำเนินการ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลหรือเจ้าหน้าที่ที่ได้รับอนุญาต";
    }
    if (/Failed to fetch|fetch failed/i.test(error.message || "")) {
        return "เชื่อมต่อ Supabase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตและค่า Environment Variables";
    }
    return error.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
}

export default function StaffTeacherClient() {
    const [supabase] = useState(() => createClient());
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState("");
    const [kindFilter, setKindFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadStaff = useCallback(async () => {
        setLoading(true);
        setPageError("");
        const { data, error } = await supabase
            .from("faculty_members")
            .select("id, profile_id, kind, full_name, position, education, expertise, research, email, phone, office_room, consult_hours, photo_url, sort_order, is_active, created_at, updated_at")
            .order("sort_order", { ascending: true })
            .order("full_name", { ascending: true });

        if (error) {
            setPageError(errorMessage(error));
            setStaff([]);
        } else {
            setStaff(data || []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    const filteredStaff = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase();
        return staff.filter((person) => {
            const matchesSearch =
                !keyword ||
                [
                    person.full_name,
                    person.position,
                    person.education,
                    person.expertise,
                    person.email,
                    person.phone,
                    person.office_room,
                ].some((value) => (value || "").toLocaleLowerCase().includes(keyword));
            const matchesKind = kindFilter === "all" || person.kind === kindFilter;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" ? person.is_active : !person.is_active);
            return matchesSearch && matchesKind && matchesStatus;
        });
    }, [staff, search, kindFilter, statusFilter]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setFormError("");
        setNotice("");
        setFormOpen(true);
    };

    const openEdit = (person) => {
        setEditingId(person.id);
        setForm({
            full_name: person.full_name || "",
            kind: person.kind || "teacher",
            position: person.position || "",
            education: person.education || "",
            expertise: person.expertise || "",
            research: person.research || "",
            email: person.email || "",
            phone: person.phone || "",
            office_room: person.office_room || "",
            consult_hours: person.consult_hours || "",
            photo_url: person.photo_url || "",
            is_active: Boolean(person.is_active),
        });
        setFormError("");
        setNotice("");
        setFormOpen(true);
    };

    const updateField = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setFormError("");
        setNotice("");

        if (!form.full_name.trim()) {
            setFormError("กรุณากรอกชื่อ-นามสกุล");
            return;
        }

        const payload = {
            full_name: form.full_name.trim(),
            kind: form.kind,
            position: form.position.trim() || null,
            education: form.education.trim() || null,
            expertise: form.expertise.trim() || null,
            research: form.research.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            office_room: form.office_room.trim() || null,
            consult_hours: form.consult_hours.trim() || null,
            photo_url: form.photo_url.trim() || null,
            is_active: Boolean(form.is_active),
        };

        setSaving(true);
        const result = editingId
            ? await supabase.from("faculty_members").update(payload).eq("id", editingId).select().single()
            : await supabase.from("faculty_members").insert(payload).select().single();

        if (result.error) {
            setFormError(errorMessage(result.error));
            setSaving(false);
            return;
        }

        setSaving(false);
        setFormOpen(false);
        setEditingId(null);
        setNotice(editingId ? "บันทึกการแก้ไขข้อมูลแล้ว" : "เพิ่มข้อมูลบุคลากรแล้ว");
        await loadStaff();
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setPageError("");
        const { error } = await supabase
            .from("faculty_members")
            .delete()
            .eq("id", deleteTarget.id);

        setDeleting(false);
        if (error) {
            setPageError(errorMessage(error));
            setDeleteTarget(null);
            return;
        }

        setDeleteTarget(null);
        setNotice("ลบข้อมูลบุคลากรแล้ว");
        await loadStaff();
    };

    const activeCount = staff.filter((person) => person.is_active).length;
    const teacherCount = staff.filter((person) => person.kind === "teacher").length;

    return (
        <main className="min-h-screen w-full min-w-0 bg-slate-50 px-3 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8 xl:py-7">
            <div className="mx-auto w-full min-w-0 max-w-screen-2xl space-y-4 sm:space-y-5 lg:space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1a1a1a]">จัดการบุคลากรและอาจารย์</h1>
                        <p className="mt-1 text-sm text-gray-500">จัดการข้อมูลที่บันทึกอยู่ในฐานข้อมูล Supabase</p>
                    </div>
                    <Button icon="plus" onClick={openCreate}>
                        เพิ่มบุคลากรใหม่
                    </Button>
                </div>

                {pageError && (
                    <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        <span>{pageError}</span>
                        <button onClick={() => setPageError("")} aria-label="ปิดข้อความผิดพลาด"><Icon name="close" /></button>
                    </div>
                )}
                {notice && (
                    <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <span>{notice}</span>
                        <button onClick={() => setNotice("")} aria-label="ปิดข้อความแจ้งเตือน"><Icon name="close" /></button>
                    </div>
                )}

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">บุคลากรทั้งหมด</p>
                            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Icon name="users" className="h-5 w-5" /></span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{staff.length}</p>
                        <p className="mt-1 text-xs text-slate-500">รายการจากฐานข้อมูล</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">อาจารย์</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{teacherCount}</p>
                        <p className="mt-1 text-xs text-slate-500">ประเภท teacher</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">กำลังปฏิบัติงาน</p>
                        <p className="mt-3 text-3xl font-bold text-emerald-600">{activeCount}</p>
                        <p className="mt-1 text-xs text-slate-500">รายการที่เปิดใช้งาน</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900">รายชื่อบุคลากร</h2>
                                <p className="mt-1 text-sm text-slate-500">พบ {filteredStaff.length} รายการ</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <label className="relative block">
                                    <span className="sr-only">ค้นหาบุคลากร</span>
                                    <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ อีเมล ตำแหน่ง..." className={`${fieldClass} mt-0 pl-9`} />
                                </label>
                                <label>
                                    <span className="sr-only">กรองประเภท</span>
                                    <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className={`${fieldClass} mt-0`}>
                                        <option value="all">ทุกประเภท</option><option value="teacher">อาจารย์</option><option value="staff">เจ้าหน้าที่</option>
                                    </select>
                                </label>
                                <label>
                                    <span className="sr-only">กรองสถานะ</span>
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${fieldClass} mt-0`}>
                                        <option value="all">ทุกสถานะ</option><option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] border-collapse text-left">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">บุคลากร</th>
                                    <th className="px-5 py-4">ประเภท / ตำแหน่ง</th>
                                    <th className="px-5 py-4">ข้อมูลติดต่อ</th>
                                    <th className="px-5 py-4">สถานะ</th>
                                    <th className="px-5 py-4 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-500">กำลังโหลดข้อมูลจาก Supabase...</td></tr>
                                ) : filteredStaff.map((person) => (
                                    <tr key={person.id} className="transition hover:bg-slate-50/80">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                                                    <img src={person.photo_url} alt={`รูปโปรไฟล์ของ ${person.full_name}`} className="h-full w-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{person.full_name}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{person.education || "ไม่ระบุวุฒิการศึกษา"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-800">{person.kind === "teacher" ? "อาจารย์" : "เจ้าหน้าที่"}</p>
                                            <p className="mt-1 max-w-[240px] text-xs text-slate-500">{person.position || "ไม่ระบุตำแหน่ง"}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-700">{person.email || "—"}</p>
                                            <p className="mt-1 text-xs text-slate-500">{person.phone || "—"}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${person.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                {person.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(person)} aria-label={`แก้ไข ${person.full_name}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                                    <Icon name="edit" /> แก้ไข
                                                </button>
                                                <button onClick={() => setDeleteTarget(person)} aria-label={`ลบ ${person.full_name}`} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50">
                                                    <Icon name="trash" /> ลบ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredStaff.length === 0 && (
                                    <tr><td colSpan={5} className="px-5 py-14 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name="search" className="h-5 w-5" /></div>
                                        <p className="mt-3 font-medium text-slate-800">ไม่พบข้อมูลบุคลากร</p>
                                        <p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {formOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-2 backdrop-blur-[2px] sm:items-center sm:p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !saving) {
                            setFormOpen(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="staff-form-title"
                        className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:my-6 sm:max-h-[calc(100dvh-3rem)]"
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div>
                                <h2 id="staff-form-title" className="text-lg font-bold text-slate-900">{editingId ? "แก้ไขข้อมูลบุคลากร" : "เพิ่มบุคลากรใหม่"}</h2>
                                <p className="mt-1 text-sm text-slate-500">ข้อมูลจะถูกบันทึกลงตาราง faculty_members</p>
                            </div>
                            <button type="button" disabled={saving} onClick={() => setFormOpen(false)} aria-label="ปิดฟอร์ม" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><Icon name="close" /></button>
                        </div>
                        <form onSubmit={submitForm} className="space-y-5 p-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2"><Field label="ชื่อ-นามสกุล *"><input name="full_name" value={form.full_name} onChange={updateField} className={fieldClass} placeholder="เช่น อาจารย์ ดร. สมชาย ใจดี" required /></Field></div>
                                <Field label="ประเภทบุคลากร *"><select name="kind" value={form.kind} onChange={updateField} className={fieldClass}><option value="teacher">อาจารย์</option><option value="staff">เจ้าหน้าที่</option></select></Field>
                                <Field label="ตำแหน่ง"><input name="position" value={form.position} onChange={updateField} className={fieldClass} placeholder="เช่น อาจารย์ประจำหลักสูตร" /></Field>
                                <Field label="อีเมล"><input type="email" name="email" value={form.email} onChange={updateField} className={fieldClass} placeholder="name@example.com" /></Field>
                                <Field label="เบอร์โทรศัพท์"><input name="phone" value={form.phone} onChange={updateField} className={fieldClass} placeholder="0XX-XXX-XXXX" /></Field>
                                <Field label="วุฒิการศึกษา"><input name="education" value={form.education} onChange={updateField} className={fieldClass} placeholder="ระบุวุฒิการศึกษา" /></Field>
                                <Field label="ห้องทำงาน"><input name="office_room" value={form.office_room} onChange={updateField} className={fieldClass} placeholder="เช่น CS-302" /></Field>
                                <div className="sm:col-span-2"><Field label="ความเชี่ยวชาญ"><textarea name="expertise" value={form.expertise} onChange={updateField} className={fieldClass} rows={2} placeholder="ระบุความเชี่ยวชาญ" /></Field></div>
                                <div className="sm:col-span-2"><Field label="งานวิจัย"><textarea name="research" value={form.research} onChange={updateField} className={fieldClass} rows={2} placeholder="ระบุงานวิจัยหรือความสนใจทางวิชาการ" /></Field></div>
                                <Field label="เวลาให้คำปรึกษา"><input name="consult_hours" value={form.consult_hours} onChange={updateField} className={fieldClass} placeholder="เช่น จันทร์ 13:00–15:00 น." /></Field>
                                <Field label="URL รูปภาพ"><input type="url" name="photo_url" value={form.photo_url} onChange={updateField} className={fieldClass} placeholder="https://..." /></Field>
                                <div className="sm:col-span-2">
                                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                                        <input type="checkbox" name="is_active" checked={form.is_active} onChange={updateField} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        เปิดใช้งาน / แสดงข้อมูลบุคลากร
                                    </label>
                                </div>
                            </div>
                            {formError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                <button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                    {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
                    <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Icon name="trash" className="h-6 w-6" /></div>
                        <h2 id="delete-title" className="mt-4 text-lg font-bold text-slate-900">ยืนยันการลบข้อมูล</h2>
                        <p id="delete-description" className="mt-2 text-sm leading-6 text-slate-500">
                            ต้องการลบข้อมูลของ <span className="font-semibold text-slate-800">{deleteTarget.full_name}</span> ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                        </p>
                        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                            <button disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
                            <button disabled={deleting} onClick={confirmDelete} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{deleting ? "กำลังลบ..." : "ยืนยันลบข้อมูล"}</button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
