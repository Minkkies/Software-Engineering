"use client";

/**
 * Mock data layer สำหรับหน้าจัดการผู้ใช้งาน
 * -----------------------------------------------------------------
 * ตอนนี้เก็บข้อมูลใน localStorage ของ browser (ข้อมูลไม่หายเมื่อ refresh)
 * ทุกฟังก์ชันเป็น async เพื่อให้เปลี่ยนเป็นเรียก API จริงได้ง่าย:
 *   getUsers()      -> fetch("/api/users")
 *   getUserById(id) -> fetch(`/api/users/${id}`)
 *   createUser(d)   -> fetch("/api/users", { method: "POST", ... })
 *   updateUser(id,d)-> fetch(`/api/users/${id}`, { method: "PUT", ... })
 *   deleteUser(id)  -> fetch(`/api/users/${id}`, { method: "DELETE" })
 * เมื่อทีมตกลง API/DB ได้แล้ว แก้เฉพาะไฟล์นี้ไฟล์เดียว
 */

const STORAGE_KEY = "mock_users_v1";

export const ROLES = {
    admin: "ผู้ดูแลระบบ",
    staff: "อาจารย์/บุคลากร",
    student: "นักศึกษา",
};

export const STATUSES = {
    active: "ใช้งานอยู่",
    pending: "รอยืนยัน",
    suspended: "ระงับการใช้งาน",
};

const SEED_USERS = [
    { id: "u001", firstName: "สมชาย", lastName: "รักเรียน", title: "ศ.ดร.", email: "somchai.r@university.ac.th", studentId: "", role: "admin", status: "active", lastLogin: "2024-05-20 08:30" },
    { id: "u002", firstName: "นภาพร", lastName: "ใจดี", title: "รศ.ดร.", email: "napaporn.j@university.ac.th", studentId: "", role: "staff", status: "active", lastLogin: "2024-05-19 14:15" },
    { id: "u003", firstName: "วิทวัส", lastName: "มุ่งมั่น", title: "นาย", email: "witawat.m@student.ac.th", studentId: "64010123", role: "student", status: "active", lastLogin: "2024-05-20 09:00" },
    { id: "u004", firstName: "กนกวรรณ", lastName: "สวยงาม", title: "นางสาว", email: "kanokwan.s@student.ac.th", studentId: "65010456", role: "student", status: "suspended", lastLogin: "2024-04-12 11:20" },
    { id: "u005", firstName: "ธนพล", lastName: "ขยันยิ่ง", title: "นาย", email: "tanapol.k@student.ac.th", studentId: "66010789", role: "student", status: "active", lastLogin: "2024-05-19 14:15" },
    { id: "u006", firstName: "ปรีชา", lastName: "วิเศษศักดิ์", title: "ผศ.ดร.", email: "preecha.w@university.ac.th", studentId: "", role: "staff", status: "active", lastLogin: "2024-05-18 10:05" },
    { id: "u007", firstName: "อรอุมา", lastName: "แสงทอง", title: "นางสาว", email: "onuma.s@student.ac.th", studentId: "66010812", role: "student", status: "pending", lastLogin: "-" },
    { id: "u008", firstName: "ชัยวัฒน์", lastName: "บุญมา", title: "นาย", email: "chaiwat.b@student.ac.th", studentId: "65010233", role: "student", status: "active", lastLogin: "2024-05-17 16:42" },
    { id: "u009", firstName: "ศิริพร", lastName: "พึ่งธรรม", title: "อ.", email: "siriporn.p@university.ac.th", studentId: "", role: "staff", status: "active", lastLogin: "2024-05-20 07:55" },
    { id: "u010", firstName: "พีรพัฒน์", lastName: "คงเจริญ", title: "นาย", email: "peerapat.k@student.ac.th", studentId: "64010377", role: "student", status: "suspended", lastLogin: "2024-03-02 13:10" },
    { id: "u011", firstName: "ลลิตา", lastName: "ทองคำ", title: "นางสาว", email: "lalita.t@student.ac.th", studentId: "66010901", role: "student", status: "active", lastLogin: "2024-05-20 08:12" },
    { id: "u012", firstName: "วีระ", lastName: "สุขสวัสดิ์", title: "ดร.", email: "weera.s@university.ac.th", studentId: "", role: "staff", status: "pending", lastLogin: "-" },
];

function readAll() {
    if (typeof window === "undefined") return SEED_USERS;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        /* ข้อมูลเสีย -> ใช้ seed ใหม่ */
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
}

function writeAll(users) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
        /* storage เต็ม/ถูกปิด: ข้ามไป */
    }
}

export async function getUsers() {
    return readAll();
}

export async function getUserById(id) {
    return readAll().find((u) => u.id === id) ?? null;
}

export async function createUser(data) {
    const users = readAll();
    const user = { ...data, id: `u${Date.now()}`, lastLogin: "-" };
    writeAll([user, ...users]);
    return user;
}

export async function updateUser(id, data) {
    const users = readAll().map((u) => (u.id === id ? { ...u, ...data } : u));
    writeAll(users);
    return users.find((u) => u.id === id) ?? null;
}

export async function deleteUser(id) {
    writeAll(readAll().filter((u) => u.id !== id));
}

export async function resetMockUsers() {
    writeAll(SEED_USERS);
}
