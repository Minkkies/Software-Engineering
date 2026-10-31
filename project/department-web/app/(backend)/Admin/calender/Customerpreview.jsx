'use client';

// components/CustomerPreview.jsx
// Admin-side preview that mirrors app/(main)/calender exactly
// — monthly calendar grid + event cards with category colour badges

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
  const fmt = (d) => d.toLocaleDateString('en-CA').slice(0, 10); // YYYY-MM-DD
  if (sameDay(s, e)) return fmt(s);
  return `${fmt(s)} - ${fmt(e)}`;
}

// ---------------------------------------------------------------------------
export default function CustomerPreview({ events }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Unique academic terms sorted
  const terms = useMemo(
    () => [...new Set(events.map((e) => e.academic_term).filter(Boolean))].sort(),
    [events]
  );
  const [selectedTerm, setSelectedTerm] = useState(terms[0] ?? '');

  // Events for selected term (or all)
  const termEvents = useMemo(() => {
    if (!selectedTerm) return events;
    return events.filter((e) => e.academic_term === selectedTerm);
  }, [events, selectedTerm]);

  // Build calendar grid
  const { days, prevPad, nextPad } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
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

  const selectedDayEvents = selectedDate ? eventsOnDay(selectedDate) : [];

  // Events list sorted by start_date
  const sortedEvents = useMemo(
    () => [...termEvents].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')),
    [termEvents]
  );

  return (
    <div>
      {/* Admin banner */}
      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <EyeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
          ตัวอย่างหน้าที่นักศึกษาจะเห็น — ข้อมูลนี้ยังไม่ได้ถูกเผยแพร่จนกว่าคุณจะบันทึก
        </p>
      </div>

      {/* Page Header (mirrors student page) */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            ระบบจัดการปฏิทินการศึกษา
          </h1>
          {selectedTerm && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white">
              ภาคการศึกษา {selectedTerm}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ตรวจสอบกำหนดการวิชาการ วันสอบ และกิจกรรมประจำปี
        </p>

        {/* Term selector */}
        {terms.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setSelectedTerm('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedTerm
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ทั้งหมด
            </button>
            {terms.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTerm(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTerm === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- Left: Calendar ---- */}
        <div>
          {/* Calendar widget */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">CALENDAR (ปฏิทินการศึกษา)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ส่วนกลาง</p>
              </div>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                <ChevronIcon direction="left" />
              </button>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {THAI_MONTHS[month]} {thaiYear(year)}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                <ChevronIcon direction="right" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className={`text-center text-xs font-medium py-1 ${d === 'Su' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {/* Padding before */}
              {Array.from({ length: prevPad }).map((_, i) => (
                <div key={`p-${i}`} className="h-8" />
              ))}

              {/* Days */}
              {Array.from({ length: days }).map((_, i) => {
                const dayNum = i + 1;
                const date = new Date(year, month, dayNum);
                const isToday = sameDay(date, today);
                const isSelected = selectedDate && sameDay(date, selectedDate);
                const dayEvs = eventsOnDay(date);
                const hasEvents = dayEvs.length > 0;

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDate(isSelected ? null : date)}
                    className={`relative h-8 w-full flex items-center justify-center text-sm rounded-full transition-colors mx-auto
                      ${isSelected ? 'bg-indigo-600 text-white font-semibold' :
                        isToday ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold' :
                        hasEvents ? 'hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-900 dark:text-gray-100' :
                        'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}
                      `}
                  >
                    {dayNum}
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvs.slice(0, 3).map((ev, idx) => {
                          const cfg = getEventTypeConfig(ev.event_type);
                          return (
                            <span key={idx} className={`w-1 h-1 rounded-full ${cfg.color.split(' ')[0].replace('bg-', 'bg-').split('-')[0]+'-'+cfg.color.split(' ')[0].replace('bg-', '').split('-').slice(-1)[0]}`}
                              style={{ backgroundColor: dotColor(ev.event_type) }}
                            />
                          );
                        })}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Padding after */}
              {Array.from({ length: nextPad }).map((_, i) => (
                <div key={`n-${i}`} className="h-8" />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                มีกำหนดการ
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                วันนี้
              </div>
            </div>
          </div>

          {/* Selected day events */}
          {selectedDate && selectedDayEvents.length > 0 && (
            <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                กิจกรรมวันที่ {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="space-y-2">
                {selectedDayEvents.map((ev) => (
                  <MiniEventCard key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---- Right: Event list ---- */}
        <div>
          {/* Group by type */}
          {['registration', 'semester', 'exam', 'holiday', 'activity', 'academic'].map((type) => {
            const typeEvents = sortedEvents.filter((e) => e.event_type === type);
            if (typeEvents.length === 0) return null;
            const cfg = getEventTypeConfig(type);
            return (
              <div key={type} className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: dotColor(type) }} />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cfg.label}</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                    {typeEvents.length} รายการ
                  </span>
                </div>
                <div className="space-y-3">
                  {typeEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      expanded={expandedEvent === ev.id}
                      onToggle={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {sortedEvents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">ยังไม่มีกิจกรรมในภาคการศึกษานี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Card (mirrors student view)
// ---------------------------------------------------------------------------
function EventCard({ event, expanded, onToggle }) {
  const cfg = getEventTypeConfig(event.event_type);
  return (
    <div
      className="rounded-xl border border-l-4 bg-white dark:bg-gray-900 transition-shadow hover:shadow-sm"
      style={{ borderLeftColor: dotColor(event.event_type) }}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />
                {formatDateRange(event.start_date, event.end_date)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor(event.event_type) }} />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{event.title}</p>
          </div>
          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${cfg.color} border-current/20`}>
            {event.event_type}
          </span>
        </div>

        {event.description && (
          <button
            onClick={onToggle}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors"
          >
            <InfoIcon className="w-3.5 h-3.5" />
            {expanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
          </button>
        )}

        {expanded && event.description && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}

function MiniEventCard({ event }) {
  const cfg = getEventTypeConfig(event.event_type);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.color.split(' ').slice(0, 2).join(' ')}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor(event.event_type) }} />
      <span className="text-xs font-medium truncate">{event.title}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colour helper
// ---------------------------------------------------------------------------
function dotColor(type) {
  const map = {
    semester: '#3b82f6',
    exam: '#ef4444',
    holiday: '#22c55e',
    activity: '#eab308',
    registration: '#f97316',
    academic: '#a855f7',
  };
  return map[type] ?? '#6b7280';
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function EyeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
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