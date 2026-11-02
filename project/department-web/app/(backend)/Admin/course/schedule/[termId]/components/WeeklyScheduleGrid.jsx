'use client';
// WeeklyScheduleGrid.jsx — Mon–Fri grid, colour per course; overlapping blocks in a day sit side by side
import { DAYS, toMin, hm, courseColor } from '../../../../../../../lib/courseShared';

const START = 7 * 60, END = 20 * 60, PX = 0.9; // px per minute
const HOURS = Array.from({ length: END / 60 - START / 60 + 1 }, (_, i) => START / 60 + i);

function layout(blocks) {                       // simple column packing for overlaps
  const sorted = [...blocks].sort((a, b) => a.s - b.s);
  const cols = [];
  sorted.forEach((b) => {
    let i = cols.findIndex((end) => end <= b.s);
    if (i < 0) { i = cols.length; cols.push(0); }
    cols[i] = b.e; b.col = i;
  });
  sorted.forEach((b) => { b.cols = cols.length; });
  return sorted;
}

export default function WeeklyScheduleGrid({ courses, onSelect }) {
  const days = DAYS.slice(0, 5);
  const byDay = days.map((d) => layout(courses.flatMap((c) => (c.course_schedules ?? [])
    .filter((s) => s.day_of_week === d.n)
    .map((s) => ({ c, s: toMin(s.start_time), e: toMin(s.end_time), slot: s })))
  ));
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-slate-100 bg-slate-50 text-center text-sm font-medium text-slate-600">
          <div className="py-3" />{days.map((d) => <div key={d.n} className="py-3">{d.full}</div>)}
        </div>
        <div className="grid grid-cols-[64px_repeat(5,1fr)]" style={{ height: (END - START) * PX }}>
          <div className="relative">{HOURS.map((h) => <span key={h} className="absolute right-2 -translate-y-1/2 text-xs text-slate-400" style={{ top: (h * 60 - START) * PX }}>{String(h).padStart(2, '0')}:00</span>)}</div>
          {byDay.map((blocks, i) => (
            <div key={i} className="relative border-l border-slate-100">
              {HOURS.map((h) => <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: (h * 60 - START) * PX }} />)}
              {blocks.map((b, k) => {
                const col = courseColor(b.c.code);
                return (
                  <button key={k} onClick={() => onSelect(b.c)} title={`${b.c.code} ${b.c.name_th}`}
                    className="absolute overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm hover:z-10 hover:shadow-md"
                    style={{ top: (b.s - START) * PX, height: (b.e - b.s) * PX - 2, left: `${(b.col / b.cols) * 100}%`, width: `calc(${100 / b.cols}% - 2px)`, background: col + '1a', borderColor: col, color: '#0f172a' }}>
                    <b className="font-mono">{b.c.code}</b>{b.slot.session_type && <span className="ml-1 opacity-70">{b.slot.session_type}</span>}
                    <div className="truncate">{b.slot.room}</div><div className="opacity-60">{hm(b.slot.start_time)}–{hm(b.slot.end_time)}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
