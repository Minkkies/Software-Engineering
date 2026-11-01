// app/api/schedule/parse/route.js — POST multipart(file) -> parsed schedule JSON (admin only)
import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import { createClient } from '../../../../lib/supabase/server';
import { parseScheduleText, nameKey } from '../../../../lib/parseScheduleText';

export const runtime = 'nodejs';

// Helper สกัดข้อความดิบจาก Buffer ด้วย pdf2json
function extractTextFromPdf(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // 1 = text-only extraction

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      const rawText = pdfParser.getRawTextContent();
      resolve(rawText || '');
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req) {
  const supabase = await createClient();

  // ✅ Auth Check via getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'superadmin'].includes(me?.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const file = (await req.formData()).get('file');
  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'ต้องเป็นไฟล์ PDF' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 10MB' }, { status: 400 });
  }

  let text = '';
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🟢 สกัดข้อความด้วย pdf2json
    text = await extractTextFromPdf(buffer);
  } catch (err) {
    console.error('PDF Parse Execution Error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอ่านโครงสร้างไฟล์ PDF: ' + err.message },
      { status: 500 }
    );
  }

  console.log('--- RAW PDF TEXT START ---');
  console.log(text ? text.slice(0, 1000) : 'EMPTY_TEXT');
  console.log('--- RAW PDF TEXT END ---');

  const parsed = parseScheduleText(text);
  if (!parsed.courses || !parsed.courses.length) {
    return NextResponse.json(
      { error: 'ไม่พบรายวิชาในไฟล์ (รูปแบบข้อความอาจไม่ตรงกับ Parser หรือเป็นไฟล์สแกนรูปภาพ)' },
      { status: 422 }
    );
  }

  // ✅ Resolve Faculty Members and Course History Mapping
  const [{ data: faculty }, { data: known }] = await Promise.all([
    supabase.from('faculty_members').select('*'),
    supabase.from('courses').select('code, name_th, name_en, credits').order('created_at', { ascending: false }),
  ]);

  const fName = (f) => f.name_th ?? f.full_name_th ?? f.full_name ?? f.name ?? '';
  const fMap = new Map((faculty ?? []).map((f) => [nameKey(fName(f)), f.id]));
  const kMap = new Map();
  (known ?? []).forEach((k) => kMap.has(k.code) || kMap.set(k.code, k));
  const unmatched = new Set();

  for (const c of parsed.courses) {
    const k = kMap.get(c.code);
    c.name_th = k?.name_th ?? c.code;
    c.name_en = k?.name_en ?? null;
    c.credits = k?.credits ?? 3;
    c.needs_review = !k;
    for (const s of c.slots) {
      s.teacher_id = s.instructor_names.map((n) => fMap.get(nameKey(n))).find(Boolean) ?? null;
      s.instructor_names.forEach((n) => fMap.has(nameKey(n)) || unmatched.add(n));
    }
  }

  let existing = [];
  if (parsed.semester) {
    const { data } = await supabase
      .from('courses')
      .select('code, course_schedules(id)')
      .eq('semester', parsed.semester);
    existing = data ?? [];
  }

  return NextResponse.json({ ...parsed, existing, unmatchedTeachers: [...unmatched] });
}