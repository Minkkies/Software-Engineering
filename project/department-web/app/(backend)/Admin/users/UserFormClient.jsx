"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@lib/supabase/client";
import Button from "@components/button";

const ROLES = {
    admin: "ผู้ดูแลระบบ",
    staff: "เจ้าหน้าที่",
    teacher: "อาจารย์",
    student: "นักศึกษา",
};

const STATUSES = {
    active: "ใช้งานอยู่",
    suspended: "ระงับการใช้งาน",
};

const EMPTY_FORM = {
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    studentId: "",
    role: "staff",
    status: "active",
};

const INPUT = "w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0A2FA3] focus:bg-white";

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

/**
 * ฟอร์มเดียวใช้ทั้ง "เพิ่ม" และ "แก้ไข"
 *  - ไม่ส่ง userId  -> โหมดเพิ่มผู้ใช้งานใหม่
 *  - ส่ง userId     -> โหมดแก้ไข (โหลดข้อมูลมาเติมในฟอร์ม)
 */
export default function UserFormClient({ userId }) {
    const router = useRouter();
    const isEdit = Boolean(userId);

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(isEdit);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [facultyId, setFacultyId] = useState("");

    useEffect(() => {
        const selectedFacultyId = new URLSearchParams(window.location.search).get("facultyId") || "";
        setFacultyId(selectedFacultyId);
        if (selectedFacultyId && !isEdit) {
            (async () => {
                const { data: faculty, error } = await createClient()
                    .from("faculty_members")
                    .select("id, full_name, email, kind")
                    .eq("id", selectedFacultyId)
                    .is("profile_id", null)
                    .maybeSingle();
                if (error) setSubmitError(error.message);
                else if (faculty) {
                    const [firstName = "", ...lastNames] = (faculty.full_name || "").split(/\s+/);
                    setForm((current) => ({
                        ...current,
                        firstName,
                        lastName: lastNames.join(" "),
                        email: faculty.email || "",
                        role: faculty.kind || "staff",
                    }));
                }
            })();
        }
        if (!isEdit) return;
        (async () => {
            const supabase = createClient();
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id, full_name, email, student_id, role, is_active")
                .eq("id", userId)
                .maybeSingle();

            if (error) {
                setSubmitError(error.message);
            } else if (profile) {
                const [firstName = "", ...lastNames] = (profile.full_name ?? "").split(" ");
                setForm({
                    ...EMPTY_FORM,
                    firstName,
                    lastName: lastNames.join(" "),
                    email: profile.email ?? "",
                    studentId: profile.student_id ?? "",
                    role: profile.role,
                    status: profile.is_active ? "active" : "suspended",
                });
            } else {
                setNotFound(true);
            }
            setLoading(false);
        })();
    }, [isEdit, userId]);

    function set(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((e) => ({ ...e, [name]: undefined }));
    }

    function validate() {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "กรุณากรอกชื่อ";
        if (!form.lastName.trim()) e.lastName = "กรุณากรอกนามสกุล";
        if (!form.email.trim()) e.email = "กรุณากรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!isEdit && form.password.length < 8) e.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
        if (form.studentId && !/^\d{8}$|^\d{10}$/.test(form.studentId)) e.studentId = "รหัสประจำตัวต้องเป็นตัวเลข 8 หรือ 10 หลัก";
        if (form.role === "student" && !form.studentId) e.studentId = "นักศึกษาต้องระบุรหัสประจำตัว";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev) {
        ev.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setSubmitError("");
        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            password: form.password,
            studentId: form.studentId,
            role: form.role,
            status: form.status,
        };
        try {
            if (isEdit) {
                const response = await fetch("/api/admin/users", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, id: userId }),
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error || "ไม่สามารถบันทึกการแก้ไขได้");
            } else {
                const response = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, facultyId }),
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error || "ไม่สามารถสร้างบัญชีได้");
            }
            router.push("/Admin/users");
        } catch (error) {
            setSubmitError(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">กำลังโหลดข้อมูล...</div>;

    if (notFound) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-[#F5F6F8] p-8">
                <p className="text-gray-600">ไม่พบผู้ใช้งานรายการนี้ อาจถูกลบไปแล้ว</p>
                <Link href="/Admin/users" className="rounded-lg bg-[#0A2FA3] px-4 py-2 text-sm font-medium text-white">
                    กลับไปหน้าจัดการผู้ใช้งาน
                </Link>
            </div>
        );
    }

    const statusOptions = isEdit ? ["active", "suspended"] : ["active"];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F6F8] p-4 sm:p-8">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold text-[#1a1a1a]">{isEdit ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {isEdit ? "แก้ไขข้อมูลบัญชีของอาจารย์ บุคลากร หรือนักศึกษาในระบบ" : "สร้างบัญชีใหม่สำหรับอาจารย์ บุคลากร หรือนักศึกษาเพื่อเข้าใช้งานระบบ"}
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-6 rounded-xl bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-[#1a1a1a]">แบบฟอร์มข้อมูลผู้ใช้งาน</h2>
                        <p className="text-sm text-gray-500">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อประสิทธิภาพในการจัดการสิทธิ์</p>
                    </div>

                    <div className="space-y-8 p-6">
                        <section>
                            <h3 className="border-b border-gray-200 pb-2 text-base font-bold text-[#1a1a1a]">ข้อมูลส่วนตัว</h3>
                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                <Field label="ชื่อ (ภาษาไทย)" error={errors.firstName}>
                                    <input className={`${INPUT} ${errors.firstName ? "border-red-400" : "border-gray-200"}`} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="ระบุชื่อจริง" />
                                </Field>
                                <Field label="นามสกุล (ภาษาไทย)" error={errors.lastName}>
                                    <input className={`${INPUT} ${errors.lastName ? "border-red-400" : "border-gray-200"}`} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="ระบุนามสกุล" />
                                </Field>
                                <Field label="อีเมลมหาวิทยาลัย" error={errors.email}>
                                    <input type="email" className={`${INPUT} ${errors.email ? "border-red-400" : "border-gray-200"}`} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="username@university.ac.th" />
                                </Field>
                                <Field label={form.role === "student" ? "รหัสนักศึกษา" : "รหัสประจำตัว (ถ้ามี)"} error={errors.studentId}>
                                    <input inputMode="numeric" className={`${INPUT} ${errors.studentId ? "border-red-400" : "border-gray-200"}`} value={form.studentId} onChange={(e) => set("studentId", e.target.value.trim())} placeholder="ตัวเลข 8 หรือ 10 หลัก" />
                                </Field>
                                {!isEdit && (
                                    <Field label="รหัสผ่านเริ่มต้น" error={errors.password}>
                                        <input type="password" minLength={8} autoComplete="new-password" className={`${INPUT} ${errors.password ? "border-red-400" : "border-gray-200"}`} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" />
                                    </Field>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="border-b border-gray-200 pb-2 text-base font-bold text-[#1a1a1a]">การตั้งค่าบัญชีและบทบาท</h3>
                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                <Field label="ประเภทผู้ใช้งาน">
                                    <select className={`${INPUT} border-gray-200 text-[#0A2FA3]`} value={form.role} onChange={(e) => set("role", e.target.value)}>
                                        {Object.entries(ROLES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </Field>
                                <div>
                                    <span className="mb-1.5 block text-sm font-medium text-[#1a1a1a]">{isEdit ? "สถานะบัญชี" : "สถานะเริ่มต้น"}</span>
                                    <div className="flex flex-wrap gap-2">
                                        {statusOptions.map((key) => {
                                            const selected = form.status === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    disabled={!isEdit}
                                                    onClick={() => set("status", key)}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                                        selected ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {STATUSES[key]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-4">
                                <p className="font-semibold text-orange-800">การตรวจสอบข้อมูล</p>
                                <p className="mt-0.5 text-sm text-orange-700">
                                    {isEdit
                                        ? "การเปลี่ยนอีเมลหรือบทบาทจะมีผลกับสิทธิ์การเข้าใช้งานทันที กรุณาตรวจสอบก่อนบันทึก"
                                        : "บัญชีจะถูกสร้างใน Supabase Auth พร้อม profile ตามบทบาทและสถานะที่เลือก กรุณาแจ้งรหัสผ่านเริ่มต้นให้ผู้ใช้งานอย่างปลอดภัย"}
                                </p>
                            </div>
                        </section>
                    </div>

                    {submitError && <p className="px-6 pt-4 text-sm text-red-600">{submitError}</p>}

                    <div className="flex items-center justify-end gap-4 border-t border-gray-200 bg-gray-50/50 p-6">
                        <Button variant="outline" href="/Admin/users" className="text-sm text-gray-500 hover:text-gray-800">ยกเลิกการแก้ไข</Button>
                        <Button variant="primary" type="submit" disabled={saving} className="rounded-lg bg-[#0A2FA3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#082485] disabled:opacity-60">
                            {saving ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "ยืนยันการสร้างบัญชี"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}