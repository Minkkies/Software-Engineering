'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  Eye, 
  Info, 
  ExternalLink,
  X,
  FileDown
} from 'lucide-react';
import { generateCalendarPdf } from '../../../lib/generateCalendarPdf';

export default function CalenderClient({ initialEvents = [] }) {
  // Calendar State
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().getDate());
  const [searchQuery] = useState('');

  // PDF Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  // 🟢 รายการเทอมประกาศปฏิทินใน Modal ผูก academicTerm กับ Supabase
  const pdfTermsList = [
    { id: '1', title: 'การรับสมัครนักศึกษาใหม่ ภาค 2 ปีการศึกษา 2568', academicTerm: '2/2568', startDate: '2025-10-01', endDate: '2025-11-30' },
    { id: '2', title: 'ภาค 2 ปีการศึกษา 2568', academicTerm: '2/2568', startDate: '2025-11-01', endDate: '2026-03-31' },
    { id: '3', title: 'ภาคฤดูร้อน ปีการศึกษา 2568', academicTerm: '3/2568', startDate: '2026-04-01', endDate: '2026-05-31' },
    { id: '4', title: 'ภาค 1 ปีการศึกษา 2569', academicTerm: '1/2569', startDate: '2026-06-01', endDate: '2026-10-29' },
    { id: '5', title: 'ภาค 2 และภาคฤดูร้อน ปีการศึกษา 2569', academicTerm: '2/2569', startDate: '2026-10-01', endDate: '2027-05-31' },
    { id: '6', title: 'การรับสมัครนักศึกษาใหม่ ภาค 1 ปีการศึกษา 2569', academicTerm: '1/2569', startDate: '2026-04-01', endDate: '2026-06-30' },
    { id: '7', title: 'การรับสมัครนักศึกษาใหม่ ภาค 2 ปีการศึกษา 2569', academicTerm: '2/2569', startDate: '2026-10-01', endDate: '2026-11-30' },
    { id: '8', title: 'ภาค 2 ปีการศึกษา 2569', academicTerm: '2/2569', startDate: '2026-10-01', endDate: '2027-03-23' },
    { id: '9', title: 'ภาคฤดูร้อน ปีการศึกษา 2569', academicTerm: '3/2569', startDate: '2027-03-15', endDate: '2027-05-27' }
  ];

  // 🟢 ฟังก์ชันดาวน์โหลด PDF ดึงข้อมูลจริงจาก Supabase
  const handleDownload = async (term) => {
    setGeneratingPdfId(term.id);
    try {
      await generateCalendarPdf(term, initialEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setGeneratingPdfId(null);
      }, 500);
    }
  };

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiShortDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const currentMonthThai = thaiMonths[currentDate.getMonth()];
  const currentYearThai = currentDate.getFullYear() + 543;

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // 🟢 Logic เช็คทุกวันในช่วงกิจกรรม (รองรับทั้ง Single Date และ Date Range)
  const eventsByDayMap = useMemo(() => {
    const map = new Set();
    const cYear = currentDate.getFullYear();
    const cMonth = currentDate.getMonth(); // 0-11

    const monthStart = new Date(cYear, cMonth, 1);
    const monthEnd = new Date(cYear, cMonth + 1, 0);

    initialEvents.forEach((ev) => {
      let startDate = null;
      let endDate = null;

      if (ev.start_date) {
        startDate = new Date(ev.start_date);
        endDate = ev.end_date ? new Date(ev.end_date) : startDate;
      } else if (ev.day && ev.month === cMonth && ev.year === cYear) {
        map.add(ev.day);
        return;
      }

      if (startDate && endDate) {
        // ถ้ากิจกรรมครอบคลุมช่วงเดือนปัจจุบัน
        if (startDate <= monthEnd && endDate >= monthStart) {
          const cur = new Date(Math.max(startDate, monthStart));
          const last = new Date(Math.min(endDate, monthEnd));

          while (cur <= last) {
            map.add(cur.getDate());
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    });

    return map;
  }, [initialEvents, currentDate]);

  // Filter Events List
  const filteredEvents = useMemo(() => {
    return initialEvents.filter(event => {
      const matchesSearch = searchQuery === '' || 
        (event.title && event.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.category && event.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (selectedDate !== null) {
        const dayStr = String(selectedDate).padStart(2, '0');
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
        const targetDate = `${currentDate.getFullYear()}-${monthStr}-${dayStr}`;

        return matchesSearch && (
          event.day === selectedDate || 
          event.start_date === targetDate ||
          (event.start_date <= targetDate && event.end_date >= targetDate)
        );
      }
      return matchesSearch;
    });
  }, [initialEvents, selectedDate, searchQuery, currentDate]);

  return (
    <main className="w-full min-h-screen bg-[#F5F6F8] text-slate-800 pb-16">
      <header className="bg-blue-800 px-4 pb-20 pt-10 text-center text-white">
        <span className="inline-block rounded-full border border-white/40 px-3 py-0.5 text-[11px] font-medium">Academic Calendar</span>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">ปฏิทินการศึกษา</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-blue-100">ตรวจสอบกำหนดการวิชาการ วันสอบ และกิจกรรมประจำปี</p>
      </header>

      {/* Grid Content */}
      <div className="mx-auto -mt-10 grid max-w-7xl grid-cols-1 gap-6 px-4 items-start lg:grid-cols-12 lg:px-6">

        {/* ฝั่งซ้าย: ปฏิทิน + แบนเนอร์ PDF */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-900">ประกาศปฏิทินฉบับเต็ม (PDF)</p>
                <p className="text-[11px] text-rose-600">อัปเดตล่าสุด: 25 ต.ค. 2569</p>
              </div>
            </div>
            <button 
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-100/50 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">CALENDAR (ปฏิทินการศึกษา)</h3>
                  <p className="text-xs text-slate-400">ส่วนกลาง</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2 text-slate-700">
                  {currentMonthThai} {currentYearThai}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-1 hover:bg-white rounded-lg text-slate-600 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mt-4 text-center">
              {thaiShortDays.map((day, index) => (
                <div key={day} className={`text-xs font-bold py-1.5 ${index === 0 ? 'text-rose-500' : index === 6 ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mt-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 text-slate-200 text-xs flex items-center justify-center">
                  {30 - firstDayOfWeek + i + 1}
                </div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDate === dayNum;
                // 🟢 ดึงข้อมูล status ว่ามีกิจกรรมจริงในวันนี้หรือไม่ (รองรับช่วงวัน)
                const hasEvents = eventsByDayMap.has(dayNum);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDate(selectedDate === dayNum ? null : dayNum)}
                    className={`h-10 rounded-xl text-xs font-medium relative flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-900 font-bold ring-2 ring-amber-400/40 shadow-xs scale-105 z-10'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {/* 🟢 Dot Status ส้ม แสดงผลตลอดทุกวันที่เป็นช่วงกิจกรรม */}
                    {hasEvents && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-slate-900' : 'bg-amber-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> มีกำหนดการ</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-200" /> วันนี้</span>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-blue-600 font-medium hover:underline text-[11px] cursor-pointer">
                {selectedDate ? 'ล้างการกรองวัน' : 'คลิกวันที่เพื่อกรอง'}
              </button>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: รายการการ์ดกิจกรรม */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              <h3 className="font-bold text-slate-900 text-base">กำหนดการกิจกรรม</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {filteredEvents.length} รายการ
              </span>
              {selectedDate && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  วันที่ {selectedDate} {currentMonthThai}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all duration-200 relative group overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.dateRangeText || `${item.start_date || ''} - ${item.end_date || ''}`}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${item.statusColor || 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.badgeColor || 'bg-amber-500'}`} />
                      {item.statusText || 'กำหนดการกิจกรรม'}
                    </span>

                    <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200/60 ml-auto">
                      {item.academic_term ? `ภาค ${item.academic_term}` : (item.category || item.event_type)}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>

                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-mono mt-1.5 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {item.link}
                    </a>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> ตรวจสอบเงื่อนไขกับสำนักทะเบียน
                    </span>

                    <button 
                      onClick={() => alert(`รายละเอียดกิจกรรม: ${item.title}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรายละเอียด</span>
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700">ไม่พบกิจกรรมในช่วงเวลานี้</h4>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  แสดงกิจกรรมทั้งหมด
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL ป๊อปอัปประกาศปฏิทิน */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  ประกาศปฏิทิน ส่วนกลาง (PDF)
                </h3>
              </div>
              <button 
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 sm:p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {pdfTermsList.map((item) => (
                <div key={item.id} className="py-3.5 px-3 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-xl transition-colors">
                  <span className="text-sm font-semibold text-slate-800 leading-snug">
                    {item.title}
                  </span>

                  <button
                    disabled={generatingPdfId === item.id}
                    onClick={() => handleDownload(item)}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{generatingPdfId === item.id ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด'}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button 
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}