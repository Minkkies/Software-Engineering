'use client';
// Mr30UploadModal.jsx — upload PDF to Storage bucket "mr30-documents" + insert mr30_documents row
import { useRef, useState } from 'react';
import { browserSupabase } from '../../../../../../lib/supabase/courseSupabase.browser';

const BUCKET = 'mr30-documents';
const MAX = 20 * 1024 * 1024;

export default function Mr30UploadModal({ adminId, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [semester, setSemester] = useState('');
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);

  function pick(f) {
    setError('');
    if (!f) return;
    if (f.type !== 'application/pdf') return setError('รองรับเฉพาะไฟล์ PDF');
    if (f.size > MAX) return setError('ไฟล์ใหญ่เกิน 20MB');
    setFile(f);
    // ปรับปรุง Regex การแกะภาคการศึกษาจากชื่อไฟล์
    const m = f.name.match(/([123])\D{0,10}(25\d{2})/);
    if (m && !semester) setSemester(`${m[1]}/${m[2]}`);
  }

  async function submit() {
    if (!/^[123]\/\d{4}$/.test(semester)) {
      return setError('ภาคการศึกษาต้องอยู่ในรูปแบบ ภาค/ปี เช่น 2/2569');
    }
    setBusy(true); 
    setError('');
    
    try {
      const db = browserSupabase();
      const path = `${semester.replace('/', '-')}/${Date.now()}.pdf`;

      // 1. Upload ไฟล์ไปยัง Storage
      const { data: upData, error: upError } = await db.storage
        .from(BUCKET)
        .upload(path, file, { contentType: 'application/pdf' });

      if (upError) {
        console.error('Storage Upload Error:', upError);
        setBusy(false);
        return setError('อัปโหลดไม่สำเร็จ: ' + upError.message);
      }

      // 2. บันทึกข้อมูลลง Database
      const { error: dbError } = await db.from('mr30_documents').insert({
        semester,
        title: file.name,
        file_path: path,
        file_size: file.size,
        status: publish ? 'published' : 'pending',
        uploaded_by: adminId || null // ป้องกัน adminId เป็น undefined
      });

      if (dbError) {
        console.error('Database Insert Error:', dbError);
        // ลบไฟล์ที่อัปโหลดไปแล้วออกหากลง DB ไม่สำเร็จ
        await db.storage.from(BUCKET).remove([path]);
        setBusy(false);
        return setError('บันทึกข้อมูลไม่สำเร็จ: ' + dbError.message);
      }

      setBusy(false);
      onDone();

      
    } catch (err) {
      console.error('Unexpected Upload Exception:', err);
      setBusy(false);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด: ' + (err.message || err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">อัปโหลดเอกสาร มร.30</h2>
          <p className="text-xs text-slate-500">ไฟล์จะถูกจัดเก็บเพื่ออ่านและดาวน์โหลดเท่านั้น ไม่มีการแยกข้อมูลจากไฟล์</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <button type="button" onClick={() => input.current?.click()} className="w-full rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-400 hover:bg-blue-50/40">
            <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
            <p className="font-medium text-slate-700">{file ? file.name : 'คลิกเพื่อเลือกไฟล์ PDF'}</p>
            <p className="mt-1 text-xs text-slate-400">{file ? `${(file.size / 1048576).toFixed(1)} MB` : 'ไม่เกิน 20MB'}</p>
          </button>
          <label className="block text-sm font-medium text-slate-700">ภาคการศึกษา
            <input value={semester} onChange={(e) => setSemester(e.target.value.trim())} placeholder="เช่น 2/2569" className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            เผยแพร่ทันที (ไม่เลือก = รอการตรวจสอบ)
          </label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={!file || busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'กำลังอัปโหลด…' : 'อัปโหลด'}
          </button>
        </div>
      </div>
    </div>
  );
}