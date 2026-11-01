'use client';
// OverwriteConfirmModal.jsx — duplicate-term warning with side-by-side conflict preview
import { useEffect, useState } from 'react';
import { browserSupabase } from '../../../../../../lib/supabase/courseSupabase.browser';

export default function OverwriteConfirmModal({ semester, incoming, busy, onCancel, onConfirm }) {
  const [existing, setExisting] = useState(null);
  useEffect(() => {
    browserSupabase().from('courses').select('code, name_th, course_schedules(id)').eq('semester', semester)
      .then(({ data }) => setExisting(data ?? []));
  }, [semester]);

  if (!existing) return null;
  const oldCodes = new Set(existing.map((c) => c.code));
  const newCodes = new Set(incoming.map((c) => c.code));
  const added = [...newCodes].filter((c) => !oldCodes.has(c));
  const removed = [...oldCodes].filter((c) => !newCodes.has(c));
  const oldSlots = existing.reduce((a, c) => a + (c.course_schedules?.length ?? 0), 0);
  const newSlots = incoming.reduce((a, c) => a + c.slots.length, 0);

  const Col = ({ title, tone, courses, slots, list, listLabel }) => (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{courses} <span className="text-sm font-normal text-slate-500">วิชา</span></p>
      <p className="text-sm text-slate-600">{slots} ช่วงเวลาเรียน</p>
      <p className="mt-3 text-xs font-medium text-slate-500">{listLabel} ({list.length})</p>
      <p className="mt-1 max-h-24 overflow-y-auto font-mono text-xs text-slate-700">{list.join(', ') || '—'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">ภาคการศึกษา {semester} มีข้อมูลอยู่แล้ว</h3>
        <p className="mt-1 text-sm text-slate-500">การยืนยันจะลบข้อมูลเดิมของเทอมนี้ทั้งหมด แล้วบันทึกข้อมูลใหม่ในขั้นตอนเดียว (ถ้าล้มเหลวจะไม่มีอะไรเปลี่ยน) การแก้ไขด้วยมือในเทอมนี้จะหายไป</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Col title="ข้อมูลเดิมในระบบ" tone="border-slate-200 bg-slate-50" courses={existing.length} slots={oldSlots} list={removed} listLabel="มีเฉพาะข้อมูลเดิม (จะถูกลบ)" />
          <Col title="ข้อมูลใหม่จากไฟล์" tone="border-blue-200 bg-blue-50" courses={incoming.length} slots={newSlots} list={added} listLabel="รายวิชาใหม่" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">ยกเลิก</button>
          <button onClick={onConfirm} disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{busy ? 'กำลังเขียนทับ…' : 'ยืนยันเขียนทับ'}</button>
        </div>
      </div>
    </div>
  );
}
