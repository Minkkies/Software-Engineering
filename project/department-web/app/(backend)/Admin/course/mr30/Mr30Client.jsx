'use client';
// Mr30Client.jsx — document index (mockup 3): stats, filters, table, status actions
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { browserSupabase } from '../../../../../lib/supabase/courseSupabase.browser';
import Mr30UploadModal from '@components/Mr30UploadModal';
import Mr30ViewerModal from '@components/Mr30ViewerModal';
import Button from "@components/button";
import ConfirmDialog from "@components/ConfirmDialog";

const BUCKET = 'mr30-documents';
const STATUS = {
  published: { label: 'เผยแพร่แล้ว', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'รอการตรวจสอบ', cls: 'bg-amber-100 text-amber-700' },
  archived: { label: 'จัดเก็บแล้ว', cls: 'bg-slate-100 text-slate-600' },
};
const size = (b) => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : '—');

export default function Mr30Client({ initialDocs, adminId }) {
  const [docs, setDocs] = useState(initialDocs);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [upload, setUpload] = useState(false);
  const [view, setView] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const shown = useMemo(() => docs.filter((d) => (!status || d.status === status)
    && (!q || `${d.title} ${d.semester}`.toLowerCase().includes(q.toLowerCase()))), [docs, q, status]);
  const count = (s) => docs.filter((d) => d.status === s).length;

  async function reload() {
    const { data, error: e } = await browserSupabase().from('mr30_documents').select('*, uploader:uploaded_by(full_name)').order('created_at', { ascending: false });
    if (e) setError(e.message); else setDocs(data);
  }
  async function setDocStatus(d, s) {
    setMenu(null);
    const { error: e } = await browserSupabase().from('mr30_documents').update({ status: s, updated_at: new Date().toISOString() }).eq('id', d.id);
    if (e) setError(e.message); else reload();
  }
  function remove(d) {
    setMenu(null);
    setDeleteTarget(d);
  }
  async function confirmRemove() {
    if (!deleteTarget) return;
    setDeleting(true);
    const db = browserSupabase();
    const { error: storageError } = await db.storage.from(BUCKET).remove([deleteTarget.file_path]);
    if (storageError) {
      setError(storageError.message);
      setDeleting(false);
      return;
    }
    const { error: e } = await db.from('mr30_documents').delete().eq('id', deleteTarget.id);
    if (e) setError(e.message);
    else {
      setDeleteTarget(null);
      reload();
    }
    setDeleting(false);
  }
  async function download(d) {
    const { data, error: e } = await browserSupabase().storage.from(BUCKET).createSignedUrl(d.file_path, 60, { download: d.title });
    if (e) setError(e.message); else window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8" onClick={() => setMenu(null)}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500"><Link href="/Admin/course" className="hover:underline">จัดการหลักสูตร</Link> › <span className="text-slate-800">จัดการเอกสาร มร.30</span></p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">รายการเอกสาร มร.30</h1>
            <p className="max-w-xl text-slate-500">ดัชนีรวมเอกสารตารางเรียน มร.30 ของแต่ละภาคการศึกษา ตรวจสอบสถานะ และเผยแพร่เข้าสู่ระบบ</p>
          </div>
          <Button icon="plus" onClick={() => setUpload(true)}>
            อัปโหลดเอกสารใหม่
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[['เอกสารทั้งหมด', docs.length, 'text-slate-900'], ['เผยแพร่แล้ว', count('published'), 'text-emerald-600'], ['รอการตรวจสอบ', count('pending'), 'text-amber-600'], ['จัดเก็บแล้ว', count('archived'), 'text-slate-500']].map(([l, v, c]) => (
            <div key={l} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{l}</p><p className={`mt-1 text-2xl font-bold ${c}`}>{v} <span className="text-sm font-normal text-slate-400">รายการ</span></p></div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อไฟล์หรือภาคการศึกษา…" className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">สถานะทั้งหมด</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </div>
          {error && <p className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3 font-medium">ภาค/ปี</th><th className="px-4 py-3 font-medium">ชื่อไฟล์เอกสาร</th><th className="px-4 py-3 font-medium">สถานะ</th><th className="px-4 py-3 font-medium">อัปเดตล่าสุด</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-blue-700">{d.semester}</td>
                  <td className="px-4 py-3"><p className="font-medium text-slate-900">{d.title}</p><p className="text-xs text-slate-400">{size(d.file_size)} • โดย {d.uploader?.full_name ?? '—'}</p></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[d.status].cls}`}>{STATUS[d.status].label}</span></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(d.updated_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="relative whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setView(d)} className="mr-3 text-blue-600 hover:underline">ดู</button>
                    <button onClick={() => download(d)} className="mr-3 text-blue-600 hover:underline">ดาวน์โหลด</button>
                    <button onClick={() => setMenu(menu === d.id ? null : d.id)} aria-label="เมนูเพิ่มเติม" className="rounded px-2 text-slate-500 hover:bg-slate-100">⋮</button>
                    {menu === d.id && (
                      <div className="absolute right-4 top-10 z-10 w-44 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                        {d.status !== 'published' && <button onClick={() => setDocStatus(d, 'published')} className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">เผยแพร่</button>}
                        {d.status !== 'pending' && <button onClick={() => setDocStatus(d, 'pending')} className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">ย้ายไปรอตรวจสอบ</button>}
                        {d.status !== 'archived' && <button onClick={() => setDocStatus(d, 'archived')} className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">จัดเก็บ</button>}
                        <button onClick={() => remove(d)} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">ลบ</button>
                      </div>)}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-400">{docs.length ? 'ไม่พบเอกสารที่ตรงกับเงื่อนไข' : 'ยังไม่มีเอกสาร — กด “อัปโหลดเอกสารใหม่” เพื่อเริ่มต้น'}</td></tr>}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">แสดง {shown.length} จาก {docs.length} รายการ</p>
        </div>
      </div>
      {upload && <Mr30UploadModal adminId={adminId} onClose={() => setUpload(false)} onDone={() => { setUpload(false); reload(); }} />}
      {view && <Mr30ViewerModal doc={view} onClose={() => setView(null)} />}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="ยืนยันการลบเอกสาร"
        message={deleteTarget ? `ต้องการลบเอกสาร “${deleteTarget.title}” อย่างถาวรใช่หรือไม่?` : ""}
        confirmLabel="ลบเอกสาร"
        loading={deleting}
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
