// app/api/calendar/parse-pdf/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createRequire } from 'module';
import { deriveAcademicTerm } from '../../../../lib/termUtils';

const require = createRequire(import.meta.url);

function convertThaiNumerals(str) {
  if (!str) return '';
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return str.replace(/[๐-๙]/g, (w) => thaiNums.indexOf(w));
}

const THAI_MONTHS = {
  'ม.ค.': '01', 'มกราคม': '01', 
  'ก.พ.': '02', 'กุมภาพันธ์': '02',
  'มี.ค.': '03', 'มีนาคม': '03', 
  'เม.ย.': '04', 'เมษายน': '04',
  'พ.ค.': '05', 'พฤษภาคม': '05', 
  'มิ.ย.': '06', 'มิถุนายน': '06',
  'ก.ค.': '07', 'กรกฎาคม': '07', 
  'ส.ค.': '08', 'สิงหาคม': '08',
  'ก.ย.': '09', 'กันยายน': '09', 
  'ต.ค.': '10', 'ตุลาคม': '10',
  'พ.ย.': '11', 'พฤศจิกายน': '11', 
  'ธ.ค.': '12', 'ธันวาคม': '12'
};

function determineEventType(text) {
  if (text.includes('สอบ')) return 'exam';
  if (text.includes('สมัคร') || text.includes('ลงทะเบียน')) return 'registration';
  if (text.includes('บรรยาย') || text.includes('เปิดภาค') || text.includes('ปิดภาค') || text.includes('ภาคเรียน')) return 'semester';
  if (text.includes('หยุด') || text.includes('ชดเชย')) return 'holiday';
  if (text.includes('วิชาการ') || text.includes('อนุมัติ') || text.includes('บอกเลิก')) return 'academic';
  return 'activity';
}

// 🟢 ฟังก์ชันทำความสะอาดชื่อกิจกรรม ปลอดภัย 100% ไม่ติด Unicode Range Error
function cleanEventTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = rawTitle;

  // 1. ตัดชื่อเดือนภาษาไทยทั้งหมดออก
  for (const mName of Object.keys(THAI_MONTHS)) {
    title = title.split(mName).join('');
  }

  // 2. ตัดชื่อวันย่อในสัปดาห์ (จ., อ., พ., พฤ., ศ., ส., อา.)
  title = title.replace(/(?:จ|อ|พ|พฤ|ศ|ส|อา)\./g, ' ');

  // 3. ตัดปี พ.ศ. (2568, 2569, 2570) และวันที่ (1-31)
  title = title
    .replace(/25\d{2}/g, ' ')
    .replace(/\b([1-9]|[12]\d|3[01])\b/g, ' ');

  // 4. ตัดอักขระขยะภาษาอังกฤษและสัญลักษณ์ทั่วไปช่วงหน้าออก
  title = title
    .replace(/^[a-zA-Z0-9\s.\/\\\-_~`!\?@#$%^&*()=+|:<>;,'"]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 5. ตัดอักขระพิเศษส่วนต้นอีกรอบเพื่อความสะอาด
  title = title.replace(/^[^ก-ฮ]+/, '').trim();

  return title;
}

function parseThaiDateSmart(text, defaultYearBE = 2569) {
  const norm = convertThaiNumerals(text);

  const yearMatches = norm.match(/25\d{2}/g);
  let yearBE = defaultYearBE;
  if (yearMatches && yearMatches.length > 0) {
    const validYear = parseInt(yearMatches[0], 10);
    if (validYear >= 2567 && validYear <= 2575) {
      yearBE = validYear;
    }
  }

  let foundMonth = '01';
  for (const [mName, mCode] of Object.entries(THAI_MONTHS)) {
    if (norm.includes(mName)) {
      foundMonth = mCode;
      break;
    }
  }

  const dayMatches = norm.match(/\b([1-9]|[12]\d|3[01])\b/g);
  let startDay = '01';
  let endDay = '01';

  if (dayMatches && dayMatches.length > 0) {
    const validDays = dayMatches.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 31);
    if (validDays.length > 0) {
      startDay = String(validDays[0]).padStart(2, '0');
      endDay = validDays[1] ? String(validDays[1]).padStart(2, '0') : startDay;
    }
  }

  const yearAD = yearBE - 543;
  const startDate = `${yearAD}-${foundMonth}-${startDay}`;
  let endDate = `${yearAD}-${foundMonth}-${endDay}`;

  if (new Date(endDate) < new Date(startDate)) {
    endDate = startDate;
  }

  return { start: startDate, end: endDate };
}

function processTextToEvents(rawText) {
  const cleanText = convertThaiNumerals(rawText);
  
  let baseYearBE = 2569;
  if (cleanText.includes('2568')) baseYearBE = 2568;
  if (cleanText.includes('2569')) baseYearBE = 2569;
  if (cleanText.includes('2570')) baseYearBE = 2570;

  const lines = cleanText
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 5);

  const events = [];

  for (const line of lines) {
    if (
      line.includes('ประกาศมหาวิทยาลัย') ||
      line.includes('เรื่อง ปฏิทินการศึกษา') ||
      line.includes('เพื่อให้การปฏิบัติงาน') ||
      line.includes('มหาวิทยาลัยรามคำแหงจึงได้กำหนด') ||
      line.includes('ปฏิบัติราชการแทน') ||
      line.includes('ผู้อำนวยการสำนักบริการ')
    ) continue;

    const hasMonth = Object.keys(THAI_MONTHS).some(m => line.includes(m));
    const hasDigit = /\d+/.test(line);

    if (hasMonth && hasDigit) {
      const dates = parseThaiDateSmart(line, baseYearBE);
      const cleanTitle = cleanEventTitle(line);

      if (cleanTitle.length >= 3) {
        events.push({
          title: cleanTitle,
          description: cleanTitle,
          event_type: determineEventType(cleanTitle),
          start_date: dates.start,
          end_date: dates.end,
          academic_term: deriveAcademicTerm(dates.start),
        });
      }
    }
  }

  return events;
}

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const { text } = await req.json();
      const events = processTextToEvents(text || '');
      return NextResponse.json({ success: true, events, data: events, total: events.length });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ PDF ในการอัปโหลด' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawText = '';
    try {
      const pdfParsePkg = require('pdf-parse');
      let parseFn = typeof pdfParsePkg === 'function' ? pdfParsePkg : (pdfParsePkg.default || pdfParsePkg.PDFParse);
      if (parseFn) {
        const parsed = await parseFn(buffer);
        rawText = parsed.text || '';
      }
    } catch (e) {
      rawText = '';
    }

    const parsedEvents = processTextToEvents(rawText);

    return NextResponse.json({
      success: true,
      events: parsedEvents,
      data: parsedEvents,
      total: parsedEvents.length,
      is_scanned: parsedEvents.length === 0,
    });

  } catch (error) {
    console.error('PDF Router Exception:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอ่านไฟล์ PDF: ' + error.message },
      { status: 500 }
    );
  }
}