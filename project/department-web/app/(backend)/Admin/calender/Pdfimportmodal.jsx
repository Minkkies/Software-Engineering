'use client';

// app/(backend)/Admin/calender/Pdfimportmodal.jsx

import { useState, useRef } from 'react';
import { ModalOverlay } from './EventModal';
import { Spinner } from './CalenderClient';
import { deriveAcademicTerm } from '../../../../lib/termUtils';

export default function PdfImportModal({ onClose, onParsed }) {
  const [tab, setTab] = useState('pdf');
  const [rawText, setRawText] = useState('');
  const [rawJson, setRawJson] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  // 🟢 Helper: โหลด PDF.js จาก CDN โดยตรง หลบ Turbopack/Webpack สแกนเจอ canvas 100%
  async function loadPdfJsFromCDN() {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      return window.pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('โหลดสคริปต์ PDF.js ไม่สำเร็จ'));
        }
      };
      script.onerror = () => reject(new Error('ไม่สามารถโหลด PDF.js จาก CDN ได้'));
      document.head.appendChild(script);
    });
  }

  // 🟢 OCR สแกนภาพ PDF ฝั่ง Client ด้วย HTML5 Canvas + Tesseract.js (ไม่ต้องผ่าน Node canvas)
  async function runClientSideOCR(pdfFile) {
    setStatusText('กำลังเตรียมระบบ OCR ภาษาไทย...');

    // เรียกใช้ PDF.js จาก CDN window object โดยตรง (ไม่มี import pdfjs-dist)
    const pdfjsLib = await loadPdfJsFromCDN();

    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let combinedText = '';
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('tha+eng');

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      setStatusText(`กำลังสแกนรูปภาพภาษาไทย OCR หน้า ${pageNum}/${pdf.numPages}...`);
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      combinedText += '\n' + data.text;
    }

    await worker.terminate();
    return combinedText;
  }

  async function handleParse() {
    setError('');
    setLoading(true);

    try {
      if (tab === 'pdf' && file) {
        setStatusText('กำลังส่งไฟล์ตรวจสอบข้อความ...');
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/calendar/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();
        let eventsList = result.events || result.data || [];

        // ถ้าผลลัพธ์เป็น 0 รายการ (PDF สแกนเป็นรูปภาพ) -> รัน OCR ฝั่ง Client ทันที
        if (result.is_scanned || eventsList.length === 0) {
          const ocrText = await runClientSideOCR(file);

          if (!ocrText.trim()) {
            throw new Error('ไม่สามารถอ่านข้อความภาษาไทยจากภาพสแกนได้');
          }

          // ส่งข้อความ OCR กลับไปให้ API จัดการเรื่อง Format วันที่และประเภทกิจกรรม
          const ocrRes = await fetch('/api/calendar/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: ocrText }),
          });

          const ocrResult = await ocrRes.json();
          eventsList = ocrResult.events || [];
        }

        if (eventsList.length === 0) {
          throw new Error('สกัดข้อมูลสำเร็จแต่ได้ 0 รายการ');
        }

        onParsed(eventsList);
      } else if (tab === 'json' && rawJson.trim()) {
        const trimmed = rawJson.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) throw new Error('ข้อมูล JSON ต้องเป็น Array [...]');
        onParsed(parsed);
      } else if (tab === 'text' && rawText.trim()) {
        const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
        const todayStr = new Date().toISOString().slice(0, 10);
        const dynamicTerm = deriveAcademicTerm(todayStr);

        const parsed = lines.map((line) => ({
          title: line.trim(),
          description: line.trim(),
          event_type: line.includes('สอบ') ? 'exam' : line.includes('สมัคร') ? 'registration' : 'activity',
          start_date: todayStr,
          end_date: todayStr,
          academic_term: dynamicTerm,
        }));
        onParsed(parsed);
      }
    } catch (err) {
      console.error('[Client Parse Catch]:', err);
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-slate-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">นำเข้าปฏิทินจาก PDF / JSON</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-lg">✕</button>
        </div>

        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          {[
            { key: 'pdf', label: 'อัปโหลด PDF (ดิจิทัล & ภาพสแกน)' },
            { key: 'text', label: 'วางข้อความ' },
            { key: 'json', label: 'วาง JSON' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); }}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                tab === t.key ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'pdf' && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all bg-slate-50"
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-sm font-semibold text-slate-700">
                {file ? file.name : 'คลิกเพื่อเลือกไฟล์ PDF ปฏิทินการศึกษา'}
              </p>
            </div>
          )}

          {tab === 'text' && (
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={10}
              placeholder="วางข้อความปฏิทิน..."
              className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900"
            />
          )}

          {tab === 'json' && (
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={10}
              placeholder='[{"title":"...", "start_date":"2025-11-01"}]'
              className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white font-mono text-xs"
            />
          )}

          {statusText && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl flex items-center gap-2">
              <Spinner className="w-4 h-4 text-blue-600" />
              <span>{statusText}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-mono break-all">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700">ยกเลิก</button>
          <button
            onClick={handleParse}
            disabled={loading || (tab === 'pdf' && !file)}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {loading && <Spinner className="w-4 h-4 text-white" />}
            <span>ประมวลผลสกัดข้อมูล</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}