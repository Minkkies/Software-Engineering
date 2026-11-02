'use client';
// PdfUploadModal.jsx — upload PDF -> /api/schedule/parse -> review -> save (atomic RPC)
import { useRef, useState } from 'react';
import { browserSupabase } from '../../../../../../lib/supabase/courseSupabase.browser';
import { DAYS } from '../../../../../../lib/courseShared';
import OverwriteConfirmModal from './OverwriteConfirmModal';

export default function PdfUploadModal({ existingTerms = [], onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(null);   // { semester, courses, warnings, unmatchedTeachers }
  const [semester, setSemester] = useState('');
  const [conflict, setConflict] = useState(false);
  const input = useRef(null);

  async function parse() {
    setBusy(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/schedule/parse', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'อ่านไฟล์ไม่สำเร็จ');
      setParsed(json); setSemester(json.semester ?? '');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setError('');
    const { error: err } = await browserSupabase().rpc('replace_term_courses', { p_semester: semester, p_payload: parsed?.courses ?? [] });
    setBusy(false);
    if (err) return setError('บันทึกล้มเหลว (ข้อมูลเดิมไม่ถูกเปลี่ยนแปลง): ' + err.message);
    onDone(semester);
  }

  const validTerm = /^[123]\/\d{4}$/.test(semester);
  const isDup = (existingTerms ?? []).includes(semester);
  
  // Safe Array Extraction
  const courses = parsed?.courses ?? [];
  const unmatchedTeachers = parsed?.unmatchedTeachers ?? [];
  const warnings = parsed?.warnings ?? [];
  const slotCount = courses.reduce((a, c) => a + (c.slots?.length ?? 0), 0);

  // Helper แปลงค่า Day ให้แสดงผลถูกต้อง
  const formatDay = (s) => {
    if (typeof s.day === 'string') return s.day;
    if (typeof s.day_of_week === 'number' && DAYS[s.day_of_week - 1]) return DAYS[s.day_of_week - 1].short;
    return s.day ?? '—';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">นำเข้าตารางสอนจาก PDF</h2>
          <p className="text-xs text-slate-500">ระบบเลือกเฉพาะรายการ “เติม / เปลี่ยนเป็น” เป็นข้อมูลล่าสุด และเก็บรายการ “เดิม” ไว้เป็นประวัติ</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!parsed ? (
            <button type="button" onClick={() => input.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 p-12 text-center hover:border-blue-400 hover:bg-blue-50/40">
              <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="font-medium text-slate-700">{file ? file.name : 'คลิกเพื่อเลือกไฟล์ PDF ตารางสอน'}</p>
              <p className="mt-1 text-xs text-slate-400">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'ไม่เกิน 10MB'}</p>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['รายวิชา', courses.length], ['ช่วงเวลาเรียน', slotCount], ['ต้องตรวจชื่อวิชา', courses.filter((c) => c.needs_review).length]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-slate-50 p-3"><p className="text-2xl font-bold text-slate-900">{v}</p><p className="text-xs text-slate-500">{l}</p></div>
                ))}
              </div>
              <label className="block text-sm font-medium text-slate-700">ภาคการศึกษา
                <input value={semester} onChange={(e) => setSemester(e.target.value.trim())} placeholder="เช่น 2/2569"
                  className={`mt-1 w-40 rounded-lg border px-3 py-2 text-sm text-slate-900 font-semibold ${validTerm ? 'border-slate-300' : 'border-red-400'}`} />
                {!validTerm && <span className="ml-2 text-xs text-red-500">รูปแบบ ภาค/ปี เช่น 2/2569</span>}
              </label>

              {courses.some((c) => c.needs_review) && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 font-medium">PDF นี้มีเฉพาะรหัสวิชา — วิชาที่ไม่เคยมีในระบบจะใช้รหัสเป็นชื่อชั่วคราวและหน่วยกิต 3 กรุณาแก้ไขในหน้าเทอมหลังนำเข้า</p>
              )}
              {unmatchedTeachers.length > 0 && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 font-medium">ไม่พบในตาราง faculty_members ({unmatchedTeachers.length} ชื่อ): {unmatchedTeachers.join(', ')} — จะบันทึกเป็นข้อความโดยไม่ผูก teacher_id</p>
              )}
              {warnings.length > 0 && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 font-medium">{warnings.join(' · ')}</p>
              )}

              {/* 🟢 ตารางแสดงตารางเรียน ปรับเป็นข้อความสีดำเข้ม (text-slate-900 / text-slate-800) */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-300 bg-white">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-left font-bold text-slate-900 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-slate-900 font-bold">รหัส</th>
                      <th className="px-3 py-2.5 text-slate-900 font-bold">เวลาเรียน</th>
                      <th className="px-3 py-2.5 text-slate-900 font-bold">ห้อง</th>
                      <th className="px-3 py-2.5 text-slate-900 font-bold">ผู้สอน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {courses.map((c) => {
                      const rooms = [...new Set(c.slots?.map((s) => s.room).filter(Boolean))];
                      const teachers = [...new Set(c.slots?.flatMap((s) => s.instructor_names ?? []).filter(Boolean))];

                      return (
                        <tr key={c.code} className="hover:bg-slate-50">
                          {/* รหัสวิชา */}
                          <td className="px-3 py-2 font-mono font-bold text-blue-900 text-sm align-top">{c.code}</td>
                          
                          {/* เวลาเรียน */}
                          <td className="px-3 py-2 text-slate-900 font-medium align-top">
                            {c.slots?.length ? (
                              c.slots.map((s, i) => (
                                <div key={i} className="py-0.5">
                                  <span className="font-semibold text-slate-800">{s.type ?? s.session_type ?? ''}</span>{' '}
                                  <span className="font-semibold">{formatDay(s)}</span>{' '}
                                  <span className="font-mono text-slate-900">{s.start_time}-{s.end_time}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500 font-normal">{c.is_staff_only ? 'STAFF' : '—'}</span>
                            )}
                          </td>

                          {/* ห้องเรียน */}
                          <td className="px-3 py-2 text-slate-900 font-medium align-top">
                            {rooms.length ? rooms.join(', ') : '—'}
                          </td>

                          {/* อาจารย์ผู้สอน */}
                          <td className="px-3 py-2 text-slate-900 font-medium align-top">
                            {teachers.length ? teachers.join(', ') : <span className="text-slate-400 font-normal">ไม่ระบุ</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">ยกเลิก</button>
          {!parsed ? (
            <button onClick={parse} disabled={!file || busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'กำลังอ่านไฟล์…' : 'อ่านข้อมูลจากไฟล์'}</button>
          ) : (
            <button onClick={() => (isDup ? setConflict(true) : save())} disabled={!validTerm || busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'กำลังบันทึก…' : `บันทึก ${courses.length} รายวิชา`}</button>
          )}
        </div>
      </div>
      {conflict && <OverwriteConfirmModal semester={semester} incoming={courses} busy={busy}
        onCancel={() => setConflict(false)} onConfirm={async () => { await save(); setConflict(false); }} />}
    </div>
  );
}