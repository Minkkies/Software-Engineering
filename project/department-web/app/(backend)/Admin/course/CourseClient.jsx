'use client';
// CourseClient.jsx — two module cards (mirrors mockup 1)
import Link from 'next/link';

const MODULES = [
  { href: '/Admin/course/schedule', title: 'จัดการตารางเรียนในสาขา', sub: 'Department Class Schedule Management',
    desc: 'จัดการตารางสอนและเวลาเรียนของคณาจารย์และนักศึกษาภายในสาขาวิชาวิทยาการคอมพิวเตอร์',
    tags: ['นำเข้าจาก PDF', 'ตรวจสอบห้องว่าง', 'ตารางสอนรายสัปดาห์'], stat: (s) => `${s.courses} รายวิชาในระบบ` },
  { href: '/Admin/course/mr30', title: 'จัดการ มร.30', sub: 'M.R.30 Document Management',
    desc: 'จัดการรวบรวม การตรวจสอบ และการเผยแพร่เอกสาร มร.30 สำหรับมหาวิทยาลัย',
    tags: ['อัปโหลดไฟล์ PDF', 'สถานะการเผยแพร่', 'ดาวน์โหลด'], stat: (s) => `${s.docs} เอกสาร` },
];

export default function CourseClient({ stats }) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs text-slate-500">จัดการหลักสูตร › <span className="text-slate-800">จัดการตารางเรียนและเอกสาร มร.30</span></p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">จัดการตารางเรียนและเอกสาร มร.30</h1>
        <p className="mt-1 max-w-2xl text-slate-500">ปรับปรุงข้อมูลตารางเรียนในสาขาวิชาและจัดการเอกสาร มร.30 เพื่อเตรียมความพร้อมสำหรับแต่ละภาคการศึกษา</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow">
              <h2 className="text-xl font-bold text-slate-900">{m.title}</h2>
              <p className="text-sm text-slate-400">{m.sub}</p>
              <p className="mt-4 flex-1 text-slate-600">{m.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.tags.map((t) => <span key={t} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">{t}</span>)}
              </div>
              <p className="mt-4 text-sm font-medium text-blue-700">{m.stat(stats)}</p>
              <span className="mt-4 rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white group-hover:bg-blue-700">เข้าใช้งานโมดูล →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
