// CourseTableList.jsx — searchable/filterable course table
'use client';
import { useMemo, useState } from 'react';
import { DAYS, hm, facultyName } from '../../../../../../../lib/courseShared';

export default function CourseTableList({ courses, faculty, onEdit, onDelete }) {
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');
  const [room, setRoom] = useState('');
  const rooms = useMemo(() => [...new Set(courses.flatMap((c) => c.course_schedules ?? []).map((s) => s.room).filter(Boolean))].sort(), [courses]);
  const fName = (id) => facultyName(faculty.find((f) => f.id === id));

  const rows = useMemo(() => courses.filter((c) => {
    const text = `${c.code} ${c.name_th} ${c.name_en ?? ''} ${(c.course_schedules ?? []).flatMap((s) => s.instructor_names ?? []).join(' ')}`.toLowerCase();
    const sl = c.course_schedules ?? [];
    return (!q || text.includes(q.toLowerCase()))
      && (!day || sl.some((s) => s.day_of_week === +day))
      && (!room || sl.some((s) => s.room === room));
  }), [courses, q, day, room]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ส่วนกรองข้อมูล */}
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
        <input 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="ค้นหารหัสวิชา ชื่อวิชา หรือผู้สอน…" 
          className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <select 
          value={day} 
          onChange={(e) => setDay(e.target.value)} 
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">ทุกวัน</option>
          {DAYS.slice(0, 6).map((d) => <option key={d.n} value={d.n}>{d.full}</option>)}
        </select>
        <select 
          value={room} 
          onChange={(e) => setRoom(e.target.value)} 
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">ทุกห้อง</option>
          {rooms.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* ตารางแสดงผล */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left border-b border-slate-200 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-bold">รหัส / ชื่อวิชา</th>
              <th className="px-4 py-3 font-bold">หน่วยกิต</th>
              <th className="px-4 py-3 font-bold">เวลาเรียน</th>
              <th className="px-4 py-3 font-bold">ห้อง</th>
              <th className="px-4 py-3 font-bold">ผู้สอน</th>
              <th className="px-4 py-3 font-bold">สอบ</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 align-top">
            {rows.map((c) => {
              const sl = [...(c.course_schedules ?? [])].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
              const names = [...new Set(sl.flatMap((s) => (s.instructor_names?.length ? s.instructor_names : s.teacher_id ? [fName(s.teacher_id)] : [])))];
              return (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* 1. รหัส / ชื่อวิชา */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-base font-bold text-blue-700">{c.code}</span>
                    <p className="font-bold text-slate-900 mt-0.5">{c.name_th}</p>
                    {c.name_th === c.code && (
                      <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        รอตั้งชื่อ
                      </span>
                    )}
                  </td>

                  {/* 2. หน่วยกิต */}
                  <td className="px-4 py-3 font-bold text-slate-900">{c.credits}</td>

                  {/* 3. เวลาเรียน */}
                  <td className="px-4 py-3 text-slate-900">
                    {sl.length ? (
                      sl.map((s) => (
                        <div key={s.id} className="whitespace-nowrap py-0.5 flex items-center gap-1">
                          {s.session_type && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-900">
                              {s.session_type}
                            </span>
                          )}
                          <span className="font-semibold text-slate-900">
                            {DAYS[s.day_of_week - 1]?.short}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {hm(s.start_time)}–{hm(s.end_time)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="font-normal text-slate-400">ยังไม่จัดตาราง</span>
                    )}
                  </td>

                  {/* 4. ห้อง */}
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {[...new Set(sl.map((s) => s.room).filter(Boolean))].join(', ') || '—'}
                  </td>

                  {/* 5. ผู้สอน */}
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {names.join(', ') || <span className="font-normal text-slate-400">ไม่ระบุ</span>}
                  </td>

                  {/* 6. การจัดสอบ */}
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                    {c.exam_info ?? '—'}
                  </td>

                  {/* 7. ปุ่มจัดการ */}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button 
                      onClick={() => onEdit(c)} 
                      className="mr-3 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      แก้ไข
                    </button>
                    <button 
                      onClick={() => onDelete(c)} 
                      className="font-semibold text-red-600 hover:text-red-800 hover:underline"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-medium text-slate-500">
                  ไม่พบรายวิชาที่ตรงกับเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer สรุปจำนวน */}
      <p className="border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600">
        แสดง {rows.length} จาก {courses.length} รายวิชา
      </p>
    </div>
  );
}