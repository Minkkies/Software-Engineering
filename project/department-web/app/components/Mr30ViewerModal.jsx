'use client';
// Mr30ViewerModal.jsx — read-only PDF preview (iframe, signed URL) + download
import { useEffect, useState } from 'react';
import { browserSupabase } from '../../lib/supabase/courseSupabase.browser';

export default function Mr30ViewerModal({ doc, onClose }) {
  const [url, setUrl] = useState(null);
  const [dl, setDl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const st = browserSupabase().storage.from('mr30-documents');
    Promise.all([st.createSignedUrl(doc.file_path, 600), st.createSignedUrl(doc.file_path, 600, { download: doc.title })])
      .then(([a, b]) => { if (a.error) setError(a.error.message); else { setUrl(a.data.signedUrl); setDl(b.data?.signedUrl); } });
  }, [doc]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
          <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{doc.title}</p><p className="text-xs text-slate-500">ภาคการศึกษา {doc.semester}</p></div>
          <div className="flex gap-2">
            {dl && <a href={dl} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">ดาวน์โหลด</a>}
            <button onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">ปิด</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100">
          {error ? <p className="p-8 text-center text-sm text-red-600">เปิดไฟล์ไม่ได้: {error}</p>
            : url ? <iframe src={url} title={doc.title} className="h-full w-full rounded-b-xl" />
            : <p className="p-8 text-center text-sm text-slate-500">กำลังโหลดเอกสาร…</p>}
        </div>
      </div>
    </div>
  );
}
