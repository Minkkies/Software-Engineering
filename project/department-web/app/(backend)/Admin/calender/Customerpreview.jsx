// components/CustomerPreview.jsx
'use client';

import { useState, useMemo } from 'react';
import { getEventTypeConfig } from './CalenderClient';

const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function thaiYear(year) { return year + 543; }

function parseDate(str) {
  if (!str) return null;
  return new Date(str + 'T00:00:00');
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function inRange(date, start, end) {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

function formatDateRange(start, end) {
  if (!start) return '';
  const s = parseDate(start);
  const e = parseDate(end);
  const fmt = (d) => d.toLocaleDateString('en-CA').slice(0, 10);
  if (sameDay(s, e)) return fmt(s);
  return `${fmt(s)} - ${fmt(e)}`;
}

export default function CustomerPreview({ events = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Unique terms
  const terms = useMemo(
    () => [...new Set(events.map((e) => e.academic_term).filter(Boolean))].sort(),
    [events]
  );
  const [selectedTerm, setSelectedTerm] = useState(terms[0] ?? '2/2569');

  // Filter events by term
  const termEvents = useMemo(() => {
    if (!selectedTerm) return events;
    return events.filter((e) => e.academic_term === selectedTerm);
  }, [events, selectedTerm]);

  // Build calendar grid
  const { days, prevPad, nextPad } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { days: daysInMonth, prevPad: firstDay, nextPad: (7 - ((firstDay + daysInMonth) % 7)) % 7 };
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function eventsOnDay(date) {
    return termEvents.filter((ev) => {
      const s = parseDate(ev.start_date);
      const e = parseDate(ev.end_date);
      if (!s || !e) return false;
      return inRange(date, s, e);
    });
  }

  // Active events list (Filtered by selectedDate or all term events)
  const activeEvents = useMemo(() => {
    let list = termEvents;
    if (selectedDate) {
      list = eventsOnDay(selectedDate);
    }
    return [...list].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
  }, [termEvents, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 text-slate-800 font-sans">
      
      {/* 🟢 Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            ระบบจัดการปฏิทินการศึกษา
          </h1>
          {selectedTerm && (
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">
              ภาคการศึกษา {selectedTerm}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-500">
          ตรวจสอบกำหนดการวิชาการ วันสอบ และกิจกรรมประจำปี
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 🟢 Left Column: PDF Banner + Calendar Grid */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: ประกาศ PDF */}
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/60 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                <PdfIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">ประกาศปฏิทินฉบับเต็ม (PDF)</p>
                <p className="text-xs font-medium text-red-400">อัปเดตล่าสุด: 25 ต.ค. 2569</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50">
              <DownloadIcon className="h-4 w-4" />
              ดาวน์โหลด
            </button>
          </div>

          {/* Card 2: Calendar Widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            
            {/* Title Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">CALENDAR (ปฏิทินการศึกษา)</h3>
                  <p className="text-xs font-medium text-slate-400">ส่วนกลาง</p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white text-slate-600">
                  <ChevronIcon direction="left" />
                </button>
                <span className="px-2 text-xs font-bold text-slate-700">
                  {THAI_MONTHS[month]} {thaiYear(year)}
                </span>
                <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white text-slate-600">
                  <ChevronIcon direction="right" />
                </button>
              </div>
            </div>

            {/* Day Header Labels */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold">
              {DAY_LABELS.map((d) => (
                <div key={d} className={d === 'Su' || d === 'Sa' ? 'text-blue-600' : 'text-slate-400'}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {/* Padding Previous Month */}
              {Array.from({ length: prevPad }).map((_, i) => (
                <div key={`p-${i}`} className="h-9 text-center text-xs text-slate-300 py-2">
                  {new Date(year, month, -prevPad + i + 1).getDate()}
                </div>
              ))}

              {/* Current Month Days */}
              {Array.from({ length: days }).map((_, i) => {
                const dayNum = i + 1;
                const date = new Date(year, month, dayNum);
                const isToday = sameDay(date, today);
                const isSelected = selectedDate && sameDay(date, selectedDate);
                const dayEvs = eventsOnDay(date);
                const hasEvents = dayEvs.length > 0;

                return (
                  <div key={dayNum} className="flex flex-col items-center justify-center">
                    <button
                      onClick={() => setSelectedDate(isSelected ? null : date)}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-2xl text-xs transition-all
                        ${isSelected 
                          ? 'bg-amber-400 font-bold text-slate-900 shadow-sm ring-2 ring-amber-400/50' 
                          : isToday 
                            ? 'bg-amber-100 text-amber-800 font-bold' 
                            : 'hover:bg-slate-100 text-slate-700 font-semibold'}
                      `}
                    >
                      {dayNum}
                      {hasEvents && !isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500" />
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Padding Next Month */}
              {Array.from({ length: nextPad }).map((_, i) => (
                <div key={`n-${i}`} className="h-9 text-center text-xs text-slate-300 py-2">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Calendar Legend & Clear Filter */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> มีกำหนดการ
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-300" /> วันนี้
                </span>
              </div>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-blue-600 hover:underline font-bold"
                >
                  ล้างการกรองวัน
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 🟢 Right Column: Status Bar & Event Cards List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header Status Filter Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <h2 className="text-base font-bold text-slate-900">กำหนดการกิจกรรม</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {activeEvents.length} รายการ
              </span>
              
              {/* 🟢 status วันที่เลือก */}
              {selectedDate && (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  วันที่ {selectedDate.getDate()} {THAI_MONTHS[selectedDate.getMonth()]}
                </span>
              )}
            </div>
          </div>

          {/* Event Cards Stack */}
          <div className="space-y-3">
            {activeEvents.map((ev) => {
              const cfg = getEventTypeConfig(ev.event_type);
              return (
                <div 
                  key={ev.id}
                  className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      
                      {/* Event Date Range + Category Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <ClockIcon className="h-4 w-4 text-blue-500" />
                          {formatDateRange(ev.start_date, ev.end_date)}
                        </span>
                        
                        <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {cfg?.label || 'กำหนดการกิจกรรม'}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {ev.title}
                      </h3>

                      {/* Event Description */}
                      <div className="pt-2 text-xs font-medium text-slate-400 flex items-center gap-1">
                        <InfoIcon className="h-4 w-4" />
                        <span>{ev.description || 'ตรวจสอบเงื่อนไขกับสำนักทะเบียน'}</span>
                      </div>
                    </div>

                    {/* Term Badge & Details Button */}
                    <div className="flex flex-col items-end justify-between gap-6">
                      <span className="rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1 text-xs font-bold text-amber-800">
                        ภาค {ev.academic_term || selectedTerm}
                      </span>

                      <button 
                        onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                        className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>

                  {/* Expanded Description Area */}
                  {expandedEvent === ev.id && ev.description && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {ev.description}
                    </div>
                  )}
                </div>
              );
            })}

            {activeEvents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  ไม่พบกำหนดการกิจกรรมในวันที่เลือก
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
function PdfIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z" /></svg>;
}
function DownloadIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function ChevronIcon({ direction }) {
  return direction === 'left'
    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}
function ClockIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>;
}
function InfoIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></svg>;
}
function EyeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}