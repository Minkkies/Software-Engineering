"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@lib/supabase/client";
import Button from "@components/button";
import InfoCards from "@components/InfoCards";
import DataTable, { downloadCsv } from "@components/DataTable";
import ConfirmDialog from "@components/ConfirmDialog";

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

const ROLE_BADGE = {
    admin: "bg-[#0A2FA3] text-white",
    staff: "bg-blue-100 text-blue-800",
    teacher: "bg-sky-100 text-sky-800",
    student: "border border-gray-400 bg-white text-gray-700",
};

const STATUS_STYLE = {
    active: "text-green-600",
    suspended: "text-red-500",
};

function Avatar({ user }) {
    const colors = { admin: "bg-blue-200 text-blue-900", 
        teacher: "bg-sky-200 text-sky-900", 
        staff: "bg-amber-200 text-amber-900", 
        student: "bg-indigo-200 text-indigo-900" 
    };
    if (user.photoUrl) {
        return <img src={user.photoUrl} alt={`รูปโปรไฟล์ของ ${user.firstName} ${user.lastName}`} className="h-10 w-10 shrink-0 rounded-full object-cover" />;
    }
    return <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${colors[user.role]}`}>
        {user.firstName?.slice(0, 1) || "?"}
    </span>;
}

function StatCard({ label, value, note, noteClass = "text-gray-500" }) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1a1a1a]">{value.toLocaleString()}</p>
            <p className={`mt-3 text-xs ${noteClass}`}>{note}</p>
        </div>
    );
}

/* ---------- การตั้งค่าตาราง (เฉพาะของระบบผู้ใช้งาน) ---------- */
const COLUMNS = [
    {
        key: "user",
        header: "ข้อมูลผู้ใช้งาน",
        render: (u) => (
            <div className="flex items-center gap-3">
                <Avatar user={u} />
                <div>
                    <p className="font-medium text-[#1a1a1a]">
                        {u.title} {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                </div>
            </div>
        ),
    },
    {
        key: "studentId",
        header: "รหัสประจำตัว",
        cellClassName: "font-mono text-gray-700",
        render: (u) => u.studentId || "-",
    },
    {
        key: "role",
        header: "บทบาท",
        render: (u) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role]}`}>{ROLES[u.role]}</span>,
    },
    {
        key: "status",
        header: "สถานะ",
        cellClassName: (u) => STATUS_STYLE[u.status],
        render: (u) => STATUSES[u.status],
    },
];

const FILTERS = [
    {
        key: "role",
        allLabel: "ทุกบทบาท",
        options: Object.entries(ROLES).map(([value, label]) => ({ value, label })),
    },
];

const searchText = (u) => `${u.title} ${u.firstName} ${u.lastName} ${u.email} ${u.studentId}`;

export default function UsersClient() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [unlinkedFaculty, setUnlinkedFaculty] = useState([]);
    const tableRef = useRef(null);

    async function load() {
        setLoading(true);
        setError("");
        const supabase = createClient();
        const [
            { data, error: queryError },
            { data: faculty, error: facultyError },
            { data: facultyProfiles, error: facultyProfilesError },
        ] = await Promise.all([
            supabase.from("profiles").select("id, full_name, email, student_id, role, is_active").order("created_at", { ascending: false }),
            supabase.from("faculty_members").select("id, profile_id, full_name, email, kind, photo_url").order("full_name"),
            supabase.from("profiles").select("id, email, role").in("role", ["staff", "teacher"]),
        ]);

        if (queryError || facultyError || facultyProfilesError) {
            setError((queryError || facultyError || facultyProfilesError).message);
        } else {
            setUsers(
                data.map((profile) => {
                    const [firstName = "", ...lastNames] = (profile.full_name ?? "").trim().split(/\s+/);
                    return {
                        id: profile.id,
                        title: "",
                        firstName,
                        lastName: lastNames.join(" "),
                        email: profile.email ?? "",
                        studentId: profile.student_id ?? "",
                        role: profile.role,
                        status: profile.is_active ? "active" : "suspended",
                        photoUrl: (faculty || []).find((member) => member.profile_id === profile.id)?.photo_url || "",
                        lastLogin: "-",
                    };
                })
            );
            const profilesByEmail = new Map((facultyProfiles || []).map((profile) => [profile.email?.toLowerCase(), profile]));
            setUnlinkedFaculty((faculty || []).filter((member) => !member.profile_id).map((member) => ({
                ...member,
                matchingProfile: member.email ? profilesByEmail.get(member.email.toLowerCase()) : null,
            })));
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    const stats = useMemo(
        () => ({
            total: users.length,
            staff: users.filter((u) => u.role === "staff" || u.role === "teacher").length,
            students: users.filter((u) => u.role === "student" && u.status === "active").length,
        }),
        [users]
    );

    async function handleToggleSuspend(user) {
        const supabase = createClient();
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ is_active: user.status === "suspended" })
            .eq("id", user.id);
        if (updateError) setError(updateError.message);
        else await load();
    }

    async function handleDelete(user) {
        setDeleteTarget(user);
    }

    async function linkFaculty(member) {
        setError("");
        const response = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "linkFaculty", facultyId: member.id, profileId: member.matchingProfile.id }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) setError(result.error || "ไม่สามารถเชื่อมบัญชีได้");
        else await load();
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        const response = await fetch(`/api/admin/users?id=${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
        if (!response.ok) {
            const result = await response.json();
            setError(result.error || "ไม่สามารถลบผู้ใช้งานได้");
        } else {
            setDeleteTarget(null);
            await load();
        }
        setDeleting(false);
    }

    function handleExport() {
        // ส่งออกเฉพาะแถวที่ผ่านการค้นหา/กรองในตารางขณะนั้น
        const rows = tableRef.current?.getFilteredRows() ?? users;
        downloadCsv(
            "users.csv",
            ["ชื่อ", "นามสกุล", "อีเมล", "รหัสประจำตัว", "บทบาท", "สถานะ", "เข้าสู่ระบบล่าสุด"],
            rows.map((u) => [u.firstName, u.lastName, u.email, u.studentId, ROLES[u.role], STATUSES[u.status], u.lastLogin])
        );
    }

    const rowActions = (u) => [
        { label: "แก้ไขข้อมูล", href: `/Admin/users/${u.id}/edit` },
        { label: u.status === "suspended" ? "เปิดใช้งานบัญชี" : "ระงับการใช้งาน", onClick: () => handleToggleSuspend(u) },
        { label: "ลบผู้ใช้งาน", danger: true, onClick: () => handleDelete(u) },
    ];

    return (
        <div className="w-full space-y-6 p-6">
            {/* หัวหน้า */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">จัดการผู้ใช้งาน</h1>
                    <p className="mt-1 text-sm text-gray-500">จัดการบัญชีรายชื่ออาจารย์ บุคลากร และนักศึกษาในระบบสารสนเทศ</p>
                </div>
                <div className="flex gap-3">
                    <Button href="/Admin/users/new" variant="primary" icon="plus">
                        เพิ่มผู้ใช้งานใหม่
                    </Button>
                    <Button variant="outline" icon="download" onClick={handleExport}>
                        ส่งออก CSV
                    </Button>
                </div>
            </div>

            {/* สถิติ */}
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {unlinkedFaculty.length > 0 && (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <h2 className="font-semibold text-amber-900">บุคลากรที่ยังไม่มีบัญชีเชื่อมโยง</h2>
                    <p className="mt-1 text-sm text-amber-800">ตรวจสอบอีเมลให้ตรงกับ profile เดิม หรือสร้างบัญชีใหม่เพื่อบันทึก profile_id ให้ถูกต้อง</p>
                    <div className="mt-3 space-y-2">
                        {unlinkedFaculty.map((member) => (
                            <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3">
                                <div>
                                    <p className="font-medium text-gray-900">{member.full_name}</p>
                                    <p className="text-xs text-gray-500">{member.email || "ไม่มีอีเมล"}</p>
                                </div>
                                {member.matchingProfile ? (
                                    <button type="button" onClick={() => linkFaculty(member)} className="rounded-lg bg-[#0A2FA3] px-3 py-2 text-xs font-medium text-white">
                                        เชื่อมบัญชีเดิม
                                    </button>
                                ) : (
                                    <Link href={`/Admin/users/new?facultyId=${encodeURIComponent(member.id)}`} className="rounded-lg border border-[#0A2FA3] px-3 py-2 text-xs font-medium text-[#0A2FA3]">
                                        สร้างบัญชีใหม่
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard label="ผู้ใช้งานทั้งหมด" value={stats.total} note="ข้อมูลจาก Supabase"  />
                <StatCard label="อาจารย์และบุคลากร" value={stats.staff} note="ไม่นับบัญแอดมิน" />
                <StatCard label="นักศึกษาปัจจุบัน" value={stats.students} note="Active Status" />
            </div>

            {/* ตาราง */}
            <div className="mt-8">
                <DataTable
                    ref={tableRef}
                    title="รายชื่อบัญชีผู้ใช้งาน"
                    description="แสดงรายการผู้ใช้งานทั้งหมดในฐานข้อมูลระบบสารสนเทศ"
                    columns={COLUMNS}
                    data={users}
                    loading={loading}
                    pageSize={5}
                    searchText={searchText}
                    searchPlaceholder="ค้นหาชื่อ, อีเมล, รหัสนักศึกษา..."
                    filters={FILTERS}
                    rowActions={rowActions}
                />
            </div>

            {/* <InfoCards /> */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="ยืนยันการลบผู้ใช้งาน"
                message={deleteTarget ? `ต้องการลบผู้ใช้งาน "${deleteTarget.firstName} ${deleteTarget.lastName}" ใช่หรือไม่? การลบบัญชีจะไม่สามารถย้อนกลับได้` : ""}
                confirmLabel="ลบผู้ใช้งาน"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
