"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ROLES, STATUSES, getUsers, updateUser, deleteUser } from "./userStore";
import Button from "@components/button";
import InfoCards from "@components/InfoCards";
import DataTable, { downloadCsv } from "@components/DataTable";

const ROLE_BADGE = {
    admin: "bg-[#0A2FA3] text-white",
    staff: "bg-blue-100 text-blue-800",
    student: "border border-gray-400 bg-white text-gray-700",
};

const STATUS_STYLE = {
    active: "text-green-600",
    pending: "text-amber-600",
    suspended: "text-gray-500",
};

function Avatar({ user }) {
    const colors = { admin: "bg-blue-200 text-blue-900", staff: "bg-amber-200 text-amber-900", student: "bg-indigo-200 text-indigo-900" };
    return (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${colors[user.role]}`}>
            {user.firstName.slice(0, 1)}
        </span>
    );
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
    const tableRef = useRef(null);

    async function load() {
        setUsers(await getUsers());
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    const stats = useMemo(
        () => ({
            total: users.length,
            staff: users.filter((u) => u.role === "staff" || u.role === "admin").length,
            students: users.filter((u) => u.role === "student" && u.status === "active").length,
        }),
        [users]
    );

    async function handleToggleSuspend(user) {
        await updateUser(user.id, { status: user.status === "suspended" ? "active" : "suspended" });
        await load();
    }

    async function handleDelete(user) {
        if (!window.confirm(`ต้องการลบผู้ใช้งาน "${user.firstName} ${user.lastName}" ใช่หรือไม่?`)) return;
        await deleteUser(user.id);
        await load();
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
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F6F8] p-4 sm:p-8">
            {/* หัวหน้า */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#1a1a1a]">จัดการผู้ใช้งาน</h1>
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
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard label="ผู้ใช้งานทั้งหมด" value={stats.total} note="ข้อมูลจำลอง (mock)" noteClass="text-green-600" />
                <StatCard label="อาจารย์และบุคลากร" value={stats.staff} note="รวมทุกสาขาวิชา" />
                <StatCard label="นักศึกษาปัจจุบัน" value={stats.students} note="Active Status" noteClass="text-green-600" />
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

            <InfoCards />
        </div>
    );
}
