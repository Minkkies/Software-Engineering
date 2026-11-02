// app/(main)/course/CourseClient.jsx
'use client';

import { useMemo, useState } from 'react';
import { DAYS, hm, facultyName } from '../../../lib/courseShared';

export default function CourseClient({ courses = [], faculty = [] }) {
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');
  const [room, setRoom] = useState('');

  // ดึงรายการห้องเรียนที่มีทั้งหมด (ปลอดภัยแม้ไม่มี data)
  const rooms = useMemo(
    () => [...new Set((courses || []).flatMap((c) => c.course_schedules ?? []).map((s) => s.room).filter(Boolean))].sort(),
    [courses]
  );
  
  const fName = (id) => facultyName((faculty || []).find((f) => f.id === id));

  // ฟิลเตอร์ข้อมูล (หากไม่ได้พิมพ์/เลือกอะไร จะส่งคืน courses ทั้งหมด)
  const rows = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return courses.filter((c) => {
      const text = `${c.code ?? ''} ${c.name_th ?? ''} ${c.name_en ?? ''} ${(c.course_schedules ?? []).flatMap((s) => s.instructor_names ?? []).join(' ')}`.toLowerCase();
      const sl = c.course_schedules ?? [];
      return (!q || text.includes(q.toLowerCase()))
        && (!day || sl.some((s) => s.day_of_week === +day))
        && (!room || sl.some((s) => s.room === room));
    });
  }, [courses, q, day, room]);

  return (
    <main className="min-h-screen bg-[#F5F6F8] pb-16 font-sans">
      <header className="bg-blue-800 px-4 pb-20 pt-10 text-center text-white">
          <span className="inline-block rounded-full border border-white/40 px-3 py-0.5 text-[11px] font-medium">Courses &amp; Schedule</span>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">ตารางวิชาเปิดสอน</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-blue-100">ค้นหารายวิชา เวลาเรียน ห้องเรียน และวันจัดสอบประจำภาคการศึกษา</p>
      </header>
      <div className="mx-auto -mt-10 max-w-7xl space-y-6 px-4 sm:px-6">

        {/* 🔵 Main Content Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* ส่วนช่องค้นหาและตัวกรอง */}
          <div className="flex flex-wrap gap-3 border-b border-slate-200 bg-blue-50/50 p-4">
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="ค้นหารหัสวิชา ชื่อวิชา หรืออาจารย์ผู้สอน…" 
              className="min-w-64 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs" 
            />
            <select 
              value={day} 
              onChange={(e) => setDay(e.target.value)} 
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">ทุกวัน</option>
              {DAYS.slice(0, 6).map((d) => <option key={d.n} value={d.n}>{d.full}</option>)}
            </select>
            <select 
              value={room} 
              onChange={(e) => setRoom(e.target.value)} 
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">ทุกห้องเรียน</option>
              {rooms.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* ตารางแสดงผล */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-left text-white">
                <tr>
                  <th className="px-5 py-3.5 font-bold">รหัส / ชื่อวิชา</th>
                  <th className="px-5 py-3.5 font-bold">หน่วยกิต</th>
                  <th className="px-5 py-3.5 font-bold">เวลาเรียน</th>
                  <th className="px-5 py-3.5 font-bold">ห้องเรียน</th>
                  <th className="px-5 py-3.5 font-bold">ผู้สอน</th>
                  <th className="px-5 py-3.5 font-bold">การจัดสอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {rows.map((c) => {
                  const sl = [...(c.course_schedules ?? [])].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
                  const names = [...new Set(sl.flatMap((s) => (s.instructor_names?.length ? s.instructor_names : s.teacher_id ? [fName(s.teacher_id)] : [])))];
                  
                  return (
                    <tr key={c.id || c.code} className="hover:bg-blue-50/40 transition-colors">
                      {/* 1. รหัส / ชื่อวิชา */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-base font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                          {c.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1 text-base">{c.name_th}</p>
                        {c.name_en && <p className="text-xs text-slate-500 font-medium">{c.name_en}</p>}
                      </td>

                      {/* 2. หน่วยกิต */}
                      <td className="px-5 py-4 font-bold text-slate-900 text-base">{c.credits}</td>

                      {/* 3. เวลาเรียน */}
                      <td className="px-5 py-4 text-slate-900">
                        {sl.length ? (
                          sl.map((s, idx) => (
                            <div key={s.id || idx} className="whitespace-nowrap py-0.5 flex items-center gap-2">
                              {s.session_type && (
                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                                  {s.session_type}
                                </span>
                              )}
                              <span className="font-bold text-blue-900">
                                {DAYS[s.day_of_week - 1]?.short}
                              </span>
                              <span className="font-mono font-bold text-slate-800">
                                {hm(s.start_time)}–{hm(s.end_time)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="font-semibold text-slate-400">ยังไม่กำหนด</span>
                        )}
                      </td>

                      {/* 4. ห้องเรียน */}
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {[...new Set(sl.map((s) => s.room).filter(Boolean))].join(', ') || '—'}
                      </td>

                      {/* 5. ผู้สอน */}
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {names.join(', ') || <span className="font-normal text-slate-400">ไม่ระบุ</span>}
                      </td>

                      {/* 6. การจัดสอบ */}
                      <td className="px-5 py-4 text-xs font-bold text-slate-700">
                        {c.exam_info ?? '—'}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center font-bold text-slate-500">
                      ไม่พบข้อมูลรายวิชาในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer แสดงสรุปจำนวน */}
          <div className="border-t border-slate-200 bg-blue-50/30 px-5 py-3.5 text-xs font-bold text-blue-950 flex justify-between items-center">
            <span>แสดงผล {rows.length} รายวิชาจากทั้งหมด {courses.length} รายวิชา</span>
            <span className="text-slate-500">สถานะ: แสดงข้อมูลทั้งหมด</span>
          </div>

        </div>
      </div>
    </main>
  );
}