// lib/courseShared.js — shared helpers (client + server safe)
export const termToSlug = (t) => t.replace('/', '-');       // "2/2569" -> "2-2569"
export const slugToTerm = (s) => decodeURIComponent(s).replace('-', '/');
export const DAYS = [
  { n: 1, short: 'จ.', full: 'จันทร์' }, { n: 2, short: 'อ.', full: 'อังคาร' },
  { n: 3, short: 'พ.', full: 'พุธ' },   { n: 4, short: 'พฤ.', full: 'พฤหัสบดี' },
  { n: 5, short: 'ศ.', full: 'ศุกร์' }, { n: 6, short: 'ส.', full: 'เสาร์' },
  { n: 7, short: 'อา.', full: 'อาทิตย์' },
];
export const hm = (t) => (t ?? '').slice(0, 5);
export const toMin = (t) => { const [h, m] = hm(t).split(':').map(Number); return h * 60 + m; };
// assumption: adapt if faculty_members uses other column names
export const facultyName = (f) => f?.name_th ?? f?.full_name_th ?? f?.full_name ?? f?.name ?? '—';
const PALETTE = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#4f46e5','#65a30d'];
export const courseColor = (code = '') =>
  PALETTE[[...code].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
