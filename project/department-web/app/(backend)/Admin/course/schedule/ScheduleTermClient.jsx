'use client';
// ScheduleTermClient.jsx — term list (mockup 2) + import flow
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { termToSlug } from '../../../../../lib/courseShared';
import PdfUploadModal from './components/PdfUploadModal';
import Button from "@components/button";

const fmt = (d) => (d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export default function ScheduleTermClient({ terms = [] }) {
  const router = useRouter();
  const [upload, setUpload] = useState(false);

  // ✅ Guard ป้องกัน terms เป็น null/undefined
  const safeTerms = Array.isArray(terms) ? terms : [];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">
              <Link href="/Admin/course" className="hover:underline">จัดการหลักสูตร</Link> › <span className="text-slate-800">จัดการตารางเรียนในสาขา</span>
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">ตารางเรียนในสาขา</h1>
            <p className="text-slate-500">นำเข้าตารางสอนจากไฟล์ PDF หรือแก้ไขรายวิชาแต่ละภาคการศึกษา</p>
          </div>
          <Button icon="upload" onClick={() => setUpload(true)} >
            นำเข้าไฟล์ PDF
          </Button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">ภาคการศึกษาทั้งหมด</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{safeTerms.length} ภาคการศึกษา</span>
          </div>
          {safeTerms.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-400">ยังไม่มีข้อมูล — เริ่มต้นด้วยการนำเข้าไฟล์ PDF ตารางสอน</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">ภาคการศึกษา</th>
                  <th className="px-6 py-3 font-medium">แก้ไขล่าสุด</th>
                  <th className="px-6 py-3 text-right font-medium">จำนวนวิชา</th>
                  <th className="px-6 py-3 text-right font-medium">ช่วงเวลาเรียน</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeTerms.map((t) => (
                  <tr key={t.semester} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.semester}</td>
                    <td className="px-6 py-4 text-slate-500 t">{fmt(t.updated)}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{t.courses ?? 0}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{t.slots ?? 0}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/Admin/course/schedule/${termToSlug(t.semester)}`} className="font-medium text-blue-600 hover:underline">
                        ดูข้อมูล
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {upload && (
        <PdfUploadModal
          existingTerms={safeTerms.map((t) => t.semester)}
          onClose={() => setUpload(false)}
          onDone={(sem) => {
            setUpload(false);
            router.push(`/Admin/course/schedule/${termToSlug(sem)}`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}