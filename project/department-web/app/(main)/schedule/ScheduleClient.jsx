'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  DAYS,
  toMin,
  fmtTime,
  findAllConflicts,
  conflictCourseIds,
  conflictSessionIds,
  describeConflict,
} from '../../../lib/scheduleConflicts';

const BUCKET = 'mr30-documents';

export default function ScheduleClient({
  initialSemester,
  student,
  initialCourses,
  availableBranchCourses = [],
  mr30Url,
  userId,
  serverError,
}) {
  const router = useRouter();
  const printRef = useRef(null);

  const [courses, setCourses] = useState(initialCourses);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [errorMessage, setErrorMessage] = useState(serverError || '');

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isMr30ListOpen, setIsMr30ListOpen] = useState(false);
  const [searchBranchTerm, setSearchBranchTerm] = useState('');

  // MR30 Docs List from Supabase Storage / Table
  const [mr30Docs, setMr30Docs] = useState([]);
  const [loadingMr30, setLoadingMr30] = useState(false);

  const [manualForm, setManualForm] = useState({
    code: '',
    name: '',
    credits: 3,
    day_of_week: 1,
    start_time: '09:30',
    end_time: '11:20',
    room: '',
    session_type: 'LEC',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // ดึงรายการเอกสาร มร.30 ทั้งหมดที่มีใน Storage / DB
  useEffect(() => {
    async function fetchMr30Documents() {
      setLoadingMr30(true);
      try {
        const { data, error } = await supabase
          .from('mr30_documents')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setMr30Docs(data);
        }
      } catch (e) {
        console.error('Error fetching MR30 docs:', e);
      } finally {
        setLoadingMr30(false);
      }
    }
    fetchMr30Documents();
  }, [supabase]);

  // ฟังก์ชันสำหรับเปิดดูไฟล์ PDF มร.30 จาก Storage
  const handleOpenMr30Doc = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      alert('ไม่สามารถเปิดไฟล์ มร.30 ได้: ' + err.message);
    }
  };

  const conflicts = useMemo(() => findAllConflicts(courses), [courses]);
  const flaggedCourseIds = useMemo(() => conflictCourseIds(conflicts), [conflicts]);
  const flaggedSessionIds = useMemo(() => conflictSessionIds(conflicts.time), [conflicts]);

  const totalCredits = useMemo(
    () => courses.reduce((sum, c) => sum + Number(c.credits || 0), 0),
    [courses]
  );

  const lectureHours = useMemo(
    () =>
      Number(
        courses
          .reduce((sum, c) => {
            const hrs = (c.sessions || [])
              .filter((s) => s.session_type === 'LEC')
              .reduce((sSum, s) => sSum + (toMin(s.end_time) - toMin(s.start_time)) / 60, 0);
            return sum + hrs;
          }, 0)
          .toFixed(1)
      ),
    [courses]
  );

  const labHours = useMemo(
    () =>
      Number(
        courses
          .reduce((sum, c) => {
            const hrs = (c.sessions || [])
              .filter((s) => s.session_type === 'LAB')
              .reduce((sSum, s) => sSum + (toMin(s.end_time) - toMin(s.start_time)) / 60, 0);
            return sum + hrs;
          }, 0)
          .toFixed(1)
      ),
    [courses]
  );

  const filteredBranchCourses = useMemo(() => {
    return availableBranchCourses.filter(
      (c) =>
        c.code.toLowerCase().includes(searchBranchTerm.toLowerCase()) ||
        (c.name_th && c.name_th.toLowerCase().includes(searchBranchTerm.toLowerCase()))
    );
  }, [availableBranchCourses, searchBranchTerm]);

  // พิมพ์ PDF ตารางเรียน
  const handlePrintPDF = () => {
    window.print();
  };

  // 1. เพิ่มวิชาในสาขา
  const handleAddBranchCourse = async (branchCourse) => {
    setErrorMessage('');
    if (courses.some((c) => c.code === branchCourse.code)) {
      alert('วิชานี้อยู่ในตารางเรียนเรียบร้อยแล้ว');
      return;
    }

    try {
      const payload = {
        student_id: userId,
        semester: initialSemester,
        source: 'branch',
        course_id: branchCourse.id,
      };

      const { data, error } = await supabase
        .from('student_enrollments')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(`Insert Failed: ${error.message}`);

      const newCourseObj = {
        id: branchCourse.id,
        enrollment_id: data.id,
        code: branchCourse.code,
        name: branchCourse.name_th,
        credits: branchCourse.credits,
        source: 'branch',
        sessions: branchCourse.course_schedules || [],
        exam: null,
      };

      setCourses((prev) => [...prev, newCourseObj]);
      setIsBranchModalOpen(false);
      router.refresh();
    } catch (err) {
      setErrorMessage(`ไม่สามารถเพิ่มรายวิชาได้: ${err.message}`);
    }
  };

  // 2. ลบวิชา
  const handleRemoveCourse = async (course) => {
    setErrorMessage('');
    try {
      if (course.enrollment_id) {
        const { error } = await supabase
          .from('student_enrollments')
          .delete()
          .eq('id', course.enrollment_id);

        if (error) throw new Error(`Delete Failed: ${error.message}`);
      }
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      setSelectedCourse(null);
      router.refresh();
    } catch (err) {
      setErrorMessage(`ไม่สามารถลบรายวิชาได้: ${err.message}`);
    }
  };

  // 3. เพิ่มวิชา มร.30 เอง
  const handleAddManualSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const newSessions = [
      {
        session_type: manualForm.session_type,
        day_of_week: Number(manualForm.day_of_week),
        start_time: manualForm.start_time,
        end_time: manualForm.end_time,
        room: manualForm.room || 'มร.30',
      },
    ];

    try {
      const payload = {
        student_id: userId,
        semester: initialSemester,
        source: 'mr30',
        custom_course_code: manualForm.code,
        custom_course_name: manualForm.name || manualForm.code,
        custom_credits: Number(manualForm.credits),
        custom_sessions: newSessions,
      };

      const { data, error } = await supabase
        .from('student_enrollments')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(`Manual Insert Failed: ${error.message}`);

      const addedCourse = {
        id: data.id,
        enrollment_id: data.id,
        code: data.custom_course_code,
        name: data.custom_course_name,
        credits: data.custom_credits,
        source: 'mr30',
        sessions: data.custom_sessions,
      };

      setCourses((prev) => [...prev, addedCourse]);
      setIsManualModalOpen(false);
      setManualForm({
        code: '',
        name: '',
        credits: 3,
        day_of_week: 1,
        start_time: '09:30',
        end_time: '11:20',
        room: '',
        session_type: 'LEC',
      });
      router.refresh();
    } catch (err) {
      setErrorMessage(`ไม่สามารถบันทึกวิชา มร.30 ได้: ${err.message}`);
    }
  };

  // 4. บันทึกแก้ไขวิชา มร.30
  const handleUpdateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const payload = {
        custom_course_code: editingCourse.code,
        custom_course_name: editingCourse.name,
        custom_credits: Number(editingCourse.credits),
        custom_sessions: editingCourse.sessions,
      };

      const { error } = await supabase
        .from('student_enrollments')
        .update(payload)
        .eq('id', editingCourse.enrollment_id);

      if (error) throw error;

      setCourses((prev) =>
        prev.map((c) => (c.enrollment_id === editingCourse.enrollment_id ? editingCourse : c))
      );

      setEditingCourse(null);
      setSelectedCourse(null);
      router.refresh();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + err.message);
    }
  };

  const timeSlots = Array.from({ length: 11 }, (_, i) => 8 + i);
  const TOTAL_HOURS = 10;

  return (
    <div className="-m-4 md:-m-8 min-h-screen bg-slate-100 font-sans text-slate-800 pb-16">
      {/* 1. Header Hero Banner */}
      <div className="bg-[#1d4ed8] text-white py-10 px-6 md:px-12 mb-8 shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-blue-800/80 px-3 py-1 text-xs font-semibold text-blue-100 mb-2">
              Personal Schedule
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">ตารางเรียนส่วนตัว</h1>
            <p className="mt-1 text-sm text-blue-100 opacity-90">
              ภาคเรียนที่ {initialSemester} | {student.name} ({student.code}) {student.faculty}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* ปุ่มดาวน์โหลด PDF / พิมพ์ตารางเรียน */}
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              🖨️ ดาวน์โหลด / พิมพ์ PDF
            </button>

            {/* ปุ่มเลือกดู มร.30 PDF จาก Storage */}
            <button
              onClick={() => setIsMr30ListOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              📄 เลือกดู มร.30 (PDF)
            </button>

            {/* ปุ่มเพิ่มวิชาในสาขา */}
            <button
              onClick={() => setIsBranchModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white text-blue-900 px-4 py-2 text-xs font-bold shadow-xs hover:bg-blue-50 transition-colors"
            >
              + เลือกวิชาในสาขา
            </button>

            {/* ปุ่มกรอก มร.30 เอง */}
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition-colors"
            >
              + กรอกวิชา มร.30 เอง
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div ref={printRef} className="mx-auto max-w-7xl px-4 md:px-8 space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 shadow-xs flex items-center justify-between print:hidden">
            <div>
              <p className="font-bold text-red-950">🚨 เกิดข้อผิดพลาดในระบบ:</p>
              <p className="mt-1 font-mono text-[11px] text-red-700">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-500 font-bold hover:text-red-700 text-sm px-2">✕</button>
          </div>
        )}

        {conflicts.time.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs print:hidden">
            <p className="font-bold text-amber-950">⚠️ ตรวจพบข้อขัดแย้งในตารางเรียน:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1">
              {conflicts.time.map((k, idx) => (
                <li key={`t-${idx}`}>{describeConflict(k)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 1: ส่วนบน - ตารางเรียน (Timetable Grid)           */}
        {/* ========================================================= */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs w-full">
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Header เวลา */}
              <div className="flex border-b border-slate-200 bg-slate-50/80 text-center text-[11px] font-bold text-slate-600">
                <div className="w-24 shrink-0 p-3 border-r border-slate-200">วัน / เวลา</div>
                <div className="flex-1 grid grid-cols-10 divide-x divide-slate-200">
                  {timeSlots.slice(0, 10).map((h) => (
                    <div key={h} className="p-3">
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows รายวัน */}
              {DAYS.map((dName, dIdx) => {
                const dayNum = dIdx + 1;
                return (
                  <div key={dName} className="flex border-b border-slate-100 min-h-[58px] items-stretch text-xs">
                    <div className="w-24 shrink-0 flex items-center justify-center font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200">
                      {dName}
                    </div>

                    <div className="flex-1 relative bg-white">
                      {/* Grid background lines */}
                      <div className="absolute inset-0 grid grid-cols-10 divide-x divide-slate-100 pointer-events-none">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="h-full" />
                        ))}
                      </div>

                      {/* Sessions Card */}
                      {courses.map((course) =>
                        (course.sessions || [])
                          .filter((s) => s.day_of_week === dayNum)
                          .map((session, sIdx) => {
                            const startM = toMin(session.start_time);
                            const endM = toMin(session.end_time);
                            const leftPct = Math.max(0, ((startM - 480) / (TOTAL_HOURS * 60)) * 100);
                            const widthPct = Math.min(100 - leftPct, ((endM - startM) / (TOTAL_HOURS * 60)) * 100);
                            const isConflict = flaggedSessionIds.has(session.id);

                            return (
                              <button
                                key={`${course.id}-${sIdx}`}
                                onClick={() => setSelectedCourse(course)}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                className={`absolute top-1 bottom-1 rounded-md p-2 text-left transition-all shadow-2xs z-10 ${
                                  isConflict
                                    ? 'bg-rose-100 border border-rose-400 text-rose-950 hover:bg-rose-200'
                                    : course.source === 'mr30'
                                    ? 'bg-amber-100/90 border border-amber-300 text-amber-950 hover:bg-amber-200'
                                    : 'bg-blue-100/90 border border-blue-300 text-blue-950 hover:bg-blue-200'
                                }`}
                              >
                                <div className="font-bold text-[11px] leading-tight truncate">{course.code}</div>
                                <div className="text-[10px] opacity-80 truncate">
                                  {session.room || 'TBA'} ({fmtTime(session.start_time)}-{fmtTime(session.end_time)})
                                </div>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: ส่วนล่าง - สรุปวิชา & สรุปชั่วโมงเรียน (แยกส่วนชัดเจน) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 pt-2">
          
          {/* ฝั่งซ้าย (2 Cols): ตารางสรุปรายวิชาที่ลงทะเบียน */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                📋 สรุปรายวิชาที่ลงทะเบียน
              </h3>
              <span className="text-xs font-medium text-slate-500">
                ทั้งหมด {courses.length} รายวิชา
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                ยังไม่มีรายวิชาในตาราง สามารถกด "+ เลือกวิชาในสาขา" หรือ "+ กรอกวิชา มร.30 เอง" ด้านบนได้เลย
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">รหัสวิชา</th>
                      <th className="p-2.5">ชื่อวิชา</th>
                      <th className="p-2.5">ที่มา</th>
                      <th className="p-2.5 text-center">หน่วยกิต</th>
                      <th className="p-2.5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-bold text-blue-900">{c.code}</td>
                        <td className="p-2.5 text-slate-700 font-medium">{c.name}</td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.source === 'mr30' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {c.source === 'mr30' ? 'มร.30' : 'ในสาขา'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{c.credits}</td>
                        <td className="p-2.5 text-right space-x-2">
                          <button
                            onClick={() => setSelectedCourse(c)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ฝั่งขวา (1 Col): สรุปหน่วยกิต & ชั่วโมงเรียน (ธีม Blue Box สวยงาม) */}
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-900 bg-[#1e3a8a] p-6 text-white shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-200 border-b border-blue-800/80 pb-2">
                📊 สรุปหน่วยกิต & ชั่วโมงเรียน
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-blue-300">วิชาทั้งหมด</p>
                  <p className="text-3xl font-extrabold mt-1">{courses.length}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-300">หน่วยกิตรวม</p>
                  <p className="text-3xl font-extrabold mt-1">{totalCredits}</p>
                </div>
                <div className="pt-3 border-t border-blue-800/80">
                  <p className="text-xs text-blue-300">ชม. ทฤษฎี/สัปดาห์</p>
                  <p className="text-xl font-bold mt-1">{lectureHours}</p>
                </div>
                <div className="pt-3 border-t border-blue-800/80">
                  <p className="text-xs text-blue-300">ชม. ปฏิบัติ/สัปดาห์</p>
                  <p className="text-xl font-bold mt-1">{labHours}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL SECTION: รายการป๊อปอัพทั้งหมด                      */}
      {/* ========================================================= */}

      {/* MODAL: รายการเอกสาร มร.30 (จาก Storage Bucket: mr30-documents) */}
      {isMr30ListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">📄 รายการเอกสาร มร.30 (PDF)</h3>
              <button onClick={() => setIsMr30ListOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="mt-4 space-y-2 overflow-y-auto flex-1 pr-1 max-h-[380px]">
              {loadingMr30 ? (
                <p className="text-xs text-slate-400 text-center py-6">กำลังโหลดเอกสาร มร.30…</p>
              ) : mr30Docs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <p>ไม่พบไฟล์เอกสาร มร.30 ในระบบ</p>
                  <p className="text-[10px] text-slate-400 mt-1">(ตรวจสอบไฟล์ใน Storage `mr30-documents` หรือตาราง `mr30_documents`)</p>
                </div>
              ) : (
                mr30Docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-blue-900">ภาคการศึกษา {doc.semester || '1-2569'}</div>
                      <div className="text-slate-600">{doc.title || doc.file_path}</div>
                    </div>
                    <button
                      onClick={() => handleOpenMr30Doc(doc)}
                      className="rounded-md bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-950"
                    >
                      เปิดดู PDF
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t pt-3 flex justify-end">
              <button
                onClick={() => setIsMr30ListOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: รายละเอียด / แก้ไข / ลบวิชา */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">รายละเอียดรายวิชา</h3>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <p><strong className="text-slate-800">รหัสวิชา:</strong> {selectedCourse.code}</p>
              <p><strong className="text-slate-800">ชื่อวิชา:</strong> {selectedCourse.name}</p>
              <p><strong className="text-slate-800">หน่วยกิต:</strong> {selectedCourse.credits}</p>
              <p><strong className="text-slate-800">ที่มา:</strong> {selectedCourse.source === 'mr30' ? 'มร.30 (กรอกเอง)' : 'วิชาในสาขา'}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ปิด
              </button>
              
              {selectedCourse.source === 'mr30' && (
                <button
                  onClick={() => {
                    setEditingCourse({ ...selectedCourse });
                    setSelectedCourse(null);
                  }}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  ✏️ แก้ไขข้อมูล
                </button>
              )}

              <button
                onClick={() => handleRemoveCourse(selectedCourse)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                ลบรายวิชานี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: แก้ไขวิชา มร.30 */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <form onSubmit={handleUpdateCourseSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3">แก้ไขวิชา มร.30</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">รหัสวิชา</label>
                  <input
                    required
                    value={editingCourse.code}
                    onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700">ชื่อวิชา</label>
                  <input
                    value={editingCourse.name}
                    onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                  />
                </div>
              </div>

              {editingCourse.sessions?.map((sess, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="font-semibold text-slate-700">วันเรียน</label>
                    <select
                      value={sess.day_of_week}
                      onChange={(e) => {
                        const newSess = [...editingCourse.sessions];
                        newSess[idx].day_of_week = Number(e.target.value);
                        setEditingCourse({ ...editingCourse, sessions: newSess });
                      }}
                      className="mt-1 w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
                    >
                      {DAYS.map((d, i) => (
                        <option key={d} value={i + 1}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">เวลาเริ่ม</label>
                    <input
                      type="time"
                      value={sess.start_time}
                      onChange={(e) => {
                        const newSess = [...editingCourse.sessions];
                        newSess[idx].start_time = e.target.value;
                        setEditingCourse({ ...editingCourse, sessions: newSess });
                      }}
                      className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">เวลาเลิก</label>
                    <input
                      type="time"
                      value={sess.end_time}
                      onChange={(e) => {
                        const newSess = [...editingCourse.sessions];
                        newSess[idx].end_time = e.target.value;
                        setEditingCourse({ ...editingCourse, sessions: newSess });
                      }}
                      className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                💾 บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: เลือกวิชาในสาขา */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">เลือกวิชาในสาขาที่เปิดสอน ({initialSemester})</h3>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
                value={searchBranchTerm}
                onChange={(e) => setSearchBranchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div className="mt-4 space-y-2 overflow-y-auto flex-1 pr-1 max-h-[350px]">
              {filteredBranchCourses.map((bc) => {
                const isAdded = courses.some((c) => c.code === bc.code);
                return (
                  <div
                    key={bc.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-blue-900">{bc.code}</div>
                      <div className="text-slate-700 font-medium">{bc.name_th} ({bc.credits} หน่วยกิต)</div>
                    </div>
                    <button
                      disabled={isAdded}
                      onClick={() => handleAddBranchCourse(bc)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        isAdded
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-900 text-white hover:bg-blue-950'
                      }`}
                    >
                      {isAdded ? 'เลือกแล้ว' : '+ เลือกวิชา'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: กรอก มร.30 เอง */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4 overflow-y-auto">
          <form onSubmit={handleAddManualSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl my-8">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3">กรอกวิชานอกสาขา / มร.30 เอง</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">รหัสวิชา *</label>
                  <input
                    required
                    placeholder="เช่น RAM1000"
                    value={manualForm.code}
                    onChange={(e) => setManualForm({ ...manualForm, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 uppercase text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700">ชื่อวิชา</label>
                  <input
                    placeholder="เช่น ความรู้คู่คุณธรรม"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">วันเรียน</label>
                  <select
                    value={manualForm.day_of_week}
                    onChange={(e) => setManualForm({ ...manualForm, day_of_week: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 bg-white text-slate-900"
                  >
                    {DAYS.map((d, idx) => (
                      <option key={d} value={idx + 1}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={manualForm.start_time}
                    onChange={(e) => setManualForm({ ...manualForm, start_time: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">เวลาเลิก</label>
                  <input
                    type="time"
                    value={manualForm.end_time}
                    onChange={(e) => setManualForm({ ...manualForm, end_time: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-slate-900"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                บันทึกเข้าตาราง
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}