'use client';
// CourseEditorModal.jsx — add/edit a course and its time slots
import { useState } from 'react';
import { browserSupabase } from '../../../../../../../lib/supabase/courseSupabase.browser';
import { DAYS, hm, toMin, facultyName } from '../../../../../../../lib/courseShared';

const blankSlot = () => ({ session_type: '', day_of_week: 1, start_time: '09:30', end_time: '11:20', room: '', teacher_id: '', instructor_names: '' });

export default function CourseEditorModal({ semester, course, faculty, onClose, onSaved }) {
  const isEdit = !!course;
  const [f, setF] = useState({
    code: course?.code ?? '', name_th: course?.name_th ?? '', name_en: course?.name_en ?? '',
    credits: course?.credits ?? 3, is_open: course?.is_open ?? true, exam_info: course?.exam_info ?? '', description: course?.description ?? '',
  });
  const [slots, setSlots] = useState((course?.course_schedules ?? []).map((s) => ({
    ...s, session_type: s.session_type ?? '', teacher_id: s.teacher_id ?? '', start_time: hm(s.start_time), end_time: hm(s.end_time),
    room: s.room ?? '', instructor_names: (s.instructor_names ?? []).join(', '),
  })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setSlot = (i, k, v) => setSlots((p) => p.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  function validate() {
    if (!/^[A-Z]{2,4}\d{3,4}$/i.test(f.code.trim())) return 'รหัสวิชาไม่ถูกต้อง เช่น COS2101';
    if (!f.name_th.trim()) return 'กรุณากรอกชื่อวิชา (ไทย)';
    if (f.credits < 0 || f.credits > 12) return 'หน่วยกิตต้องอยู่ระหว่าง 0–12';
    for (const [i, s] of slots.entries()) {
      if (toMin(s.end_time) <= toMin(s.start_time)) return `ช่วงเวลาที่ ${i + 1}: เวลาสิ้นสุดต้องหลังเวลาเริ่ม`;
    }
    return '';
  }

  async function save() {
    const v = validate(); if (v) return setError(v);
    setBusy(true); setError('');
    const db = browserSupabase();
    const row = { code: f.code.trim().toUpperCase(), name_th: f.name_th.trim(), name_en: f.name_en.trim() || null,
      credits: +f.credits, is_open: f.is_open, exam_info: f.exam_info.trim() || null, description: f.description.trim() || null, semester };
    const q = isEdit ? db.from('courses').update(row).eq('id', course.id).select('id').single()
                     : db.from('courses').insert(row).select('id').single();
    const { data: saved, error: e1 } = await q;
    if (e1) { setBusy(false); return setError(e1.code === '23505' ? `มีรหัสวิชา ${row.code} ในเทอม ${semester} แล้ว` : e1.message); }

    // Replace slots (simple + predictable for a handful of rows)
    if (isEdit) await db.from('course_schedules').delete().eq('course_id', saved.id);
    if (slots.length) {
      const { error: e2 } = await db.from('course_schedules').insert(slots.map((s) => ({
        course_id: saved.id, day_of_week: +s.day_of_week, start_time: s.start_time, end_time: s.end_time,
        room: s.room.trim() || null, teacher_id: s.teacher_id || null, session_type: s.session_type || null,
        instructor_names: s.instructor_names.split(',').map((x) => x.trim()).filter(Boolean),
      })));
      if (e2) { setBusy(false); return setError('บันทึกรายวิชาแล้ว แต่ช่วงเวลาเรียนล้มเหลว: ' + e2.message); }
    }
    setBusy(false); onSaved();
  }

  const inp = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const Lbl = ({ t, children, cls = '' }) => <label className={`block text-xs font-medium text-slate-600 ${cls}`}>{t}<div className="mt-1">{children}</div></label>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-6 py-4"><h2 className="text-lg font-semibold">{isEdit ? `แก้ไข ${course.code}` : 'เพิ่มรายวิชาใหม่'} <span className="text-sm font-normal text-slate-400">เทอม {semester}</span></h2></div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-6 gap-3">
            <Lbl t="รหัสวิชา *" cls="col-span-2"><input className={inp} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="COS2101" /></Lbl>
            <Lbl t="ชื่อวิชา (ไทย) *" cls="col-span-4"><input className={inp} value={f.name_th} onChange={(e) => setF({ ...f, name_th: e.target.value })} /></Lbl>
            <Lbl t="ชื่อวิชา (English)" cls="col-span-4"><input className={inp} value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} /></Lbl>
            <Lbl t="หน่วยกิต *" cls="col-span-1"><input type="number" min={0} max={12} className={inp} value={f.credits} onChange={(e) => setF({ ...f, credits: e.target.value })} /></Lbl>
            <Lbl t="เปิดสอน" cls="col-span-1"><label className="flex h-[38px] items-center gap-2 text-sm"><input type="checkbox" checked={f.is_open} onChange={(e) => setF({ ...f, is_open: e.target.checked })} />เปิด</label></Lbl>
            <Lbl t="การจัดสอบ" cls="col-span-6"><input className={inp} value={f.exam_info} onChange={(e) => setF({ ...f, exam_info: e.target.value })} placeholder="เช่น W 10 MAR.2027 A หรือ จัดสอบเอง" /></Lbl>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">ช่วงเวลาเรียน ({slots.length})</h3>
              <button type="button" onClick={() => setSlots([...slots, blankSlot()])} className="text-sm font-medium text-blue-600 hover:underline">+ เพิ่มช่วงเวลา</button></div>
            {slots.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">ยังไม่มีช่วงเวลาเรียน</p>}
            <div className="space-y-2">
              {slots.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <select className={`${inp} col-span-2`} value={s.session_type} onChange={(e) => setSlot(i, 'session_type', e.target.value)}><option value="">—</option><option>LEC</option><option>LAB</option></select>
                  <select className={`${inp} col-span-3`} value={s.day_of_week} onChange={(e) => setSlot(i, 'day_of_week', e.target.value)}>{DAYS.map((d) => <option key={d.n} value={d.n}>{d.full}</option>)}</select>
                  <input type="time" className={`${inp} col-span-2`} value={s.start_time} onChange={(e) => setSlot(i, 'start_time', e.target.value)} />
                  <input type="time" className={`${inp} col-span-2`} value={s.end_time} onChange={(e) => setSlot(i, 'end_time', e.target.value)} />
                  <input className={`${inp} col-span-2`} placeholder="ห้อง" value={s.room} onChange={(e) => setSlot(i, 'room', e.target.value)} />
                  <button type="button" onClick={() => setSlots(slots.filter((_, j) => j !== i))} aria-label="ลบช่วงเวลา" className="col-span-1 text-red-500 hover:bg-red-50 rounded-lg">✕</button>
                  <select className={`${inp} col-span-5`} value={s.teacher_id} onChange={(e) => setSlot(i, 'teacher_id', e.target.value)}><option value="">ผู้สอนหลัก (ไม่ระบุ)</option>{faculty.map((t) => <option key={t.id} value={t.id}>{facultyName(t)}</option>)}</select>
                  <input className={`${inp} col-span-7`} placeholder="ชื่อผู้สอนทั้งหมด คั่นด้วย ," value={s.instructor_names} onChange={(e) => setSlot(i, 'instructor_names', e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">ยกเลิก</button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </div>
      </div>
    </div>
  );
}
