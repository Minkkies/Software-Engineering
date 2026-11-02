'use client';
// TermDetailClient.jsx — stats, view switcher, table/grid, editor
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { browserSupabase } from '../../../../../../lib/supabase/courseSupabase.browser';
import Button from "@components/button";


import CourseTableList from './components/CourseTableList';
import WeeklyScheduleGrid from './components/WeeklyScheduleGrid';
import CourseEditorModal from './components/CourseEditorModal';

export default function TermDetailClient({ semester, initialCourses, faculty }) {
  const [courses, setCourses] = useState(initialCourses);
  const [view, setView] = useState('table');
  const [editor, setEditor] = useState(null);        // { course|null }
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const slots = courses.flatMap((c) => c.course_schedules ?? []);
    const scheduled = courses.filter((c) => c.course_schedules?.length).length;
    return {
      courses: courses.length, slots: slots.length,
      pct: courses.length ? Math.round((scheduled / courses.length) * 100) : 0,
      rooms: new Set(slots.map((s) => s.room).filter(Boolean)).size,
    };
  }, [courses]);

  async function reload() {
    const { data, error: e } = await browserSupabase().from('courses').select('*, course_schedules(*)').eq('semester', semester).order('code');
    if (e) setError(e.message); else setCourses(data);
  }
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  async function remove(c) {
    if (!confirm(`ลบรายวิชา ${c.code} ออกจากเทอม ${semester}?`)) return;
    const { error: e } = await browserSupabase().from('courses').delete().eq('id', c.id);
    if (e) return setError('ลบไม่สำเร็จ: ' + e.message);
    flash('ลบรายวิชาแล้ว'); reload();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500"><Link href="/Admin/course" className="hover:underline">จัดการหลักสูตร</Link> › <Link href="/Admin/course/schedule" className="hover:underline">ตารางเรียนในสาขา</Link> › <span className="text-slate-800">{semester}</span></p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">รายวิชาและตารางเรียน <span className="text-blue-600">{semester}</span></h1>
          </div>
          <Button onClick={() => setEditor({ course: null })} icon="plus">
            เพิ่มรายวิชาใหม่
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[['จำนวนวิชา', stats.courses], ['ช่วงเวลาเรียน', stats.slots], ['จัดตารางแล้ว', `${stats.pct}%`], ['ห้องที่ใช้งาน', stats.rooms]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{l}</p><p className="mt-1 text-2xl font-bold text-slate-900">{v}</p></div>
          ))}
        </div>

        <div className="mt-6 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
          {[['table', 'รายการวิชา'], ['grid', 'ตารางสอนรายสัปดาห์']].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} className={`rounded-md px-4 py-1.5 font-medium ${view === k ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
          ))}
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4">
          {view === 'table'
            ? <CourseTableList courses={courses} faculty={faculty} onEdit={(c) => setEditor({ course: c })} onDelete={remove} />
            : <WeeklyScheduleGrid courses={courses} onSelect={(c) => setEditor({ course: c })} />}
        </div>
      </div>

      {editor && <CourseEditorModal semester={semester} course={editor.course} faculty={faculty}
        onClose={() => setEditor(null)} onSaved={() => { setEditor(null); flash('บันทึกแล้ว'); reload(); }} />}
      {toast && <div role="status" className="fixed bottom-6 right-6 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
