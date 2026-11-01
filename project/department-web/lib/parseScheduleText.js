// lib/parseScheduleText.js

const DAY_MAP = {
  M: 1,   // Monday (จันทร์)
  TU: 2,  // Tuesday (อังคาร)
  W: 3,   // Wednesday (พุธ)
  TH: 4,  // Thursday (พฤหัสบดี)
  F: 5,   // Friday (ศุกร์)
  S: 6,   // Saturday (เสาร์)
  SUN: 7, // Sunday (อาทิตย์)
};

const MARKS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g; // สระบน/ล่าง + วรรณยุกต์ + ์
const TITLE_RE =
  /^(?:(?:ผู้ช่วยศาสตราจารย์|รองศาสตราจารย์|ศาสตราจารย์|อาจารย์)\s*|(?:ผศ|รศ|ศ|ดร|อ)(?:\.\s*|\s+))+/;

const CODE_RE = /(เดิม|เปลี่ยนเป็น)?\s*\b((?:COS|INT|RAM|SCI)\d{4})\b/;

// 🟢 ปรับ Slot Regex ให้ Room เป็น Optional เพื่อไม่ให้ข้ามบรรทัดเรียนที่ไม่มีห้อง หรือห้องถูกตัดคำ
const SLOT_RE =
  /(?:(LEC|LAB)\.?\s*)?\b(SUN|TU|TH|M|W|F|S)\s+(\d{4})-(\d{4})\b/i;

const ROOM_RE = /\b(SCL\s?\d+(?:\/\d+)?|SBB\s?\d+|KTB\s?\d+)\b/i;
const EXAM_RE = /\b(SUN|TU|TH|M|W|F|S)\s+(\d{1,2})\s+([A-Z]{3})\.(\d{4})\s+([A-Z])\b.*/i;
const SELF_EXAM_RE = /(?:จดัสอบเอง|จัดสอบเอง|การจัดสอบ).*$/i;

/** key สำหรับเทียบชื่อ: ตัดคำนำหน้า + สระ/วรรณยุกต์ + เว้นวรรค/จุด */
export function nameKey(name) {
  if (!name) return '';
  return name
    .replace(TITLE_RE, '')
    .replace(MARKS, '')
    .replace(/[\s.,]/g, '');
}

/** แก้ชื่อที่สระเพี้ยนจาก PDF เช่น ภาวลยั -> ภาวลัย, อภิชยั -> อภิชัย, สราวธุ -> สราวุธ */
function repairName(raw, rosterMap) {
  if (!raw) return null;
  
  // ตัดคำนำหน้าออก เหลือเฉพาะชื่อ-สกุล
  let n = raw.replace(TITLE_RE, '').replace(/[.,\s]+/g, '').trim();
  if (!n || n.length < 2) return null;

  // 1. ถ้ามี rosterMap ให้เทียบความถูกต้องก่อน
  const hit = rosterMap.get(nameKey(n));
  if (hit) return { name: hit, matched: true };

  // 2. ซ่อมคำสลับตำแหน่งสระบน/ล่างภาษาไทยจาก PDF Extraction
  // พยัญชนะ + พยัญชนะ + (ั|ุ|ู|ิ) -> พยัญชนะ + (ั|ุ|ู|ิ) + พยัญชนะ
  let fixed = n.replace(/([ก-ฮ])([ก-ฮ])([\u0E31\u0E38\u0E39\u0E34])/g, '$1$3$2');
  
  // ซ่อมเคสเฉพาะคำเพี้ยนยอดฮิต
  fixed = fixed
    .replace(/สราวธุ/g, 'สราวุธ')
    .replace(/อภิชยั/g, 'อภิชัย')
    .replace(/ภาวลยั/g, 'ภาวลัย')
    .replace(/อจัฉรา/g, 'อัจฉรา')
    .replace(/อณัณ์นุพนัธ์/g, 'อัณณ์นุพันธ์')
    .replace(/สุลกัษณ์/g, 'สุลักษณ์')
    .replace(/ประหยดั/g, 'ประหยัด');

  return { name: fixed, matched: false };
}

export function parseScheduleText(rawText, { roster = [] } = {}) {
  if (!rawText) return { semester: null, courses: [] };

  const rosterMap = new Map(
    roster.map((n) => [nameKey(n), n.replace(TITLE_RE, '').replace(/\s+/g, '')])
  );

  // 1. ภาคการศึกษา
  const semester =
    rawText.match(/วิชาที่เปิดสอน\s*([1-3]\/25\d{2})/)?.[1] ??
    rawText.match(/ภาคเรียนที่\s*([1-3]\/25\d{2})/)?.[1] ??
    null;

  // 2. ตัดส่วนท้าย (รายการเรียนร่วม/ปฏิทิน)
  const footerIdx = rawText.search(/(?:COS|INT)\d{4}\s*\/\s*(?:COS|INT)\d{4}/);
  const text = (footerIdx >= 0 ? rawText.slice(0, footerIdx) : rawText)
    .replace(/วิชาที่เปิดสอน\s*[1-3]\/25\d{2}/g, ' ')
    .replace(/JOB TRAINING|SPECIAL PROJECTS|INFORMATION TECHNOLOGY PROJECT/g, ' ')
    .replace(/([,\s]+)(\u0E4C)/g, '$2$1')
    .replace(/[\r\t]/g, (c) => (c === '\r' ? '' : ' '));

  const coursesMap = new Map();
  const getCourse = (code) => {
    if (!coursesMap.has(code)) {
      coursesMap.set(code, {
        code,
        current: [], old: [], new: [],
        exam: null,
        self_exam: false,
        is_staff_only: false,
      });
    }
    return coursesMap.get(code);
  };

  let cur = null;
  let mode = 'current'; // current | old | new

  for (let line of text.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // ตรวจจับรหัสวิชา
    const cm = line.match(CODE_RE);
    if (cm) {
      cur = getCourse(cm[2]);
      mode = cm[1] === 'เดิม' ? 'old' : cm[1] === 'เปลี่ยนเป็น' ? 'new' : 'current';
      line = line.replace(cm[0], ' ');
    }
    if (!cur) continue;

    if (/\bSTAFF\b/.test(line) && !SLOT_RE.test(line)) {
      cur.is_staff_only = true;
      if (SELF_EXAM_RE.test(line)) cur.self_exam = true;
      continue;
    }

    // 🟢 ตรวจสอบเวลาเรียน (SLOT)
    const sm = line.match(SLOT_RE);
    if (!sm) continue;

    // สกัดห้องเรียน (Room)
    const rm = line.match(ROOM_RE);
    const room = rm ? rm[1].replace(/\s+/g, ' ') : null;

    // ตัดส่วนรหัสเวลาเรียนออกจากบรรทัด เพื่อเอาส่วนข้อความที่เหลือไปสกัดชื่ออาจารย์และการสอบ
    let rest = line.substring(sm.index + sm[0].length);
    if (rm) rest = rest.replace(rm[0], '');

    // ตรวจจับการจัดสอบ
    const em = rest.match(EXAM_RE);
    if (em) {
      cur.exam = { day: em[1], date: em[2], month: em[3], year: em[4], session: em[5] };
    }
    if (SELF_EXAM_RE.test(rest) || SELF_EXAM_RE.test(line)) {
      cur.self_exam = true;
    }

    // ลบการจัดสอบออกจากข้อความก่อนสกัดชื่ออาจารย์
    rest = rest.replace(SELF_EXAM_RE, '').replace(EXAM_RE, '');

    // 🟢 สกัดชื่ออาจารย์ผู้สอน
    const instructors = [];
    const parts = rest.split(/[,/]/);

    for (const part of parts) {
      const fixed = repairName(part, rosterMap);
      if (
        fixed && 
        /^[\u0E00-\u0E7F]{2,}$/.test(fixed.name) &&
        !['จดัสอบเอง', 'จัดสอบเอง', 'การจัดสอบ'].includes(fixed.name)
      ) {
        instructors.push(fixed);
      }
    }

    const dayStr = sm[2].toUpperCase();

    // 🟢 บันทึกข้อมูลช่วงเวลาเรียน ( slots ) พร้อมแปลง day_of_week เป็น Integer (1-7)
    cur[mode].push({
      session_type: sm[1] ? sm[1].toUpperCase() : 'LEC',
      day: dayStr,
      day_of_week: DAY_MAP[dayStr] ?? 1, // Fallback เป็น 1 ป้องกัน null
      start_time: sm[3],
      end_time: sm[4],
      room: room,
      instructor_names: instructors.map((i) => i.name),
      _unmatched: instructors.filter((i) => !i.matched).map((i) => i.name),
    });
  }

  // 4. เลือกชุดข้อมูลที่ใช้จริง: "เปลี่ยนเป็น" > ปกติ > "เดิม"
  const courses = [...coursesMap.values()].map((c) => {
    const slots = c.new.length ? c.new : c.current.length ? c.current : c.old;
    const unmatched = [...new Set(slots.flatMap((s) => s._unmatched))];
    const instructor_names = [...new Set(slots.flatMap((s) => s.instructor_names))];

    return {
      code: c.code,
      slots: slots.map(({ _unmatched, ...s }) => s),
      instructor_names,
      exam: c.exam,
      self_exam: c.self_exam,
      is_staff_only: c.is_staff_only,
      changed: c.new.length > 0,
      previous_slots: c.new.length ? c.old.map(({ _unmatched, ...s }) => s) : [],
      needs_review:
        (!slots.length && !c.is_staff_only) ||
        (!c.new.length && !c.current.length && c.old.length > 0) ||
        (roster.length > 0 && unmatched.length > 0),
      unmatched_names: unmatched,
    };
  });

  return { semester, courses };
}