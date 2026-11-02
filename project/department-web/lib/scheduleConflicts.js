// lib/scheduleConflicts.js
export const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
export const DAYS_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
export const DAY_CODE = { M: 1, TU: 2, W: 3, TH: 4, F: 5, S: 6, SUN: 7 };

export function toMin(t) {
  if (!t) return NaN;
  const [h, m] = String(t).split(':');
  return Number(h) * 60 + Number(m);
}

export const fmtTime = (t) => (t ? String(t).slice(0, 5) : '');
export const fmtMin = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const overlap = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

export function findTimeConflicts(courses) {
  const out = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      for (const a of courses[i].sessions || []) {
        for (const b of courses[j].sessions || []) {
          if (a.day_of_week !== b.day_of_week) continue;
          const a0 = toMin(a.start_time), a1 = toMin(a.end_time);
          const b0 = toMin(b.start_time), b1 = toMin(b.end_time);
          if (overlap(a0, a1, b0, b1)) {
            out.push({
              type: 'time',
              day: a.day_of_week,
              from: Math.max(a0, b0),
              to: Math.min(a1, b1),
              a: { course: courses[i], session: a },
              b: { course: courses[j], session: b },
            });
          }
        }
      }
    }
  }
  return out;
}

export function findExamConflicts(courses) {
  const list = courses.filter((c) => c.exam?.date);
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const x = list[i].exam, y = list[j].exam;
      if (x.date !== y.date) continue;
      const timed = x.start && x.end && y.start && y.end;
      const hit = timed
        ? overlap(toMin(x.start), toMin(x.end), toMin(y.start), toMin(y.end))
        : Boolean(x.session) && x.session === y.session;
      if (hit) out.push({ type: 'exam', date: x.date, a: { course: list[i] }, b: { course: list[j] } });
    }
  }
  return out;
}

export function findAllConflicts(courses) {
  return { time: findTimeConflicts(courses), exam: findExamConflicts(courses) };
}

export function checkCandidate(candidate, courses) {
  const all = [...courses.filter((c) => c.id !== candidate.id), candidate];
  const mine = (k) => k.a.course.id === candidate.id || k.b.course.id === candidate.id;
  const { time, exam } = findAllConflicts(all);
  return { time: time.filter(mine), exam: exam.filter(mine) };
}

export const conflictSessionIds = (timeConflicts) =>
  new Set(timeConflicts.flatMap((k) => [k.a.session.id, k.b.session.id]));

export const conflictCourseIds = ({ time, exam }) =>
  new Set([...time, ...exam].flatMap((k) => [k.a.course.id, k.b.course.id]));

export function describeConflict(k) {
  const a = k.a.course.code, b = k.b.course.code;
  if (k.type === 'time') {
    return `${a} ชนกับ ${b} วัน${DAYS[k.day - 1]} ${fmtMin(k.from)}–${fmtMin(k.to)}`;
  }
  const d = new Date(k.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  return `สอบ ${a} ชนกับ ${b} วันที่ ${d}`;
}

export function sessionHours(course) {
  return (course.sessions || []).reduce((s, x) => s + (toMin(x.end_time) - toMin(x.start_time)) / 60, 0);
}