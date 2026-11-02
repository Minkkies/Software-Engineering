'use client';

// components/BulkPreviewModal.jsx
// Verify, edit, and bulk-save parsed calendar events

import { useState } from 'react';
import { ModalOverlay } from './EventModal';
import { EVENT_TYPES, getEventTypeConfig, Spinner } from './CalenderClient';

export default function BulkPreviewModal({ parsed, onSave, onClose, loading }) {
  const [rows, setRows] = useState(
    parsed.map((ev, i) => ({ ...ev, _key: i, _error: validateRow(ev) }))
  );

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const updated = { ...r, [field]: value };
        return { ...updated, _error: validateRow(updated) };
      })
    );
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    const clean = rows.map(({ _key, _error, ...rest }) => rest);
    onSave(clean);
  }

  const hasErrors = rows.some((r) => r._error);
  const validCount = rows.filter((r) => !r._error).length;

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[92vh] flex flex-col text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">ตรวจสอบข้อมูลก่อนบันทึก</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พบ {rows.length} รายการ · พร้อมบันทึก {validCount} รายการ
              {hasErrors && <span className="text-red-400 font-medium ml-1">· มีข้อผิดพลาด {rows.length - validCount} รายการ</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
            <XIcon />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4 bg-white">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-slate-500">ไม่มีรายการที่จะบันทึก</div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, i) => (
                <BulkRow
                  key={row._key}
                  row={row}
                  index={i}
                  onChange={(field, value) => updateRow(i, field, value)}
                  onRemove={() => removeRow(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl">
          <p className="text-xs text-slate-500">
            แก้ไขแต่ละรายการได้โดยตรงก่อนบันทึกลง Supabase DB
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={loading || rows.length === 0 || hasErrors}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {loading && <Spinner className="w-4 h-4 text-white" />}
              ยืนยันบันทึก {rows.length} รายการ สู่ Supabase
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ---------------------------------------------------------------------------
// Single editable row
// ---------------------------------------------------------------------------
function BulkRow({ row, onChange, onRemove }) {
  const typeConfig = getEventTypeConfig(row.event_type);

  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      row._error
        ? 'border-red-300 bg-red-50'
        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
    }`}>
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Title */}
        <div className="col-span-12 sm:col-span-4">
          <label className="text-xs font-medium text-slate-700 mb-1 block">ชื่อกิจกรรม *</label>
          <input
            type="text"
            value={row.title ?? ''}
            onChange={(e) => onChange('title', e.target.value)}
            className={rowInput(row._error?.includes('title'))}
          />
        </div>

        {/* Type Enum Dropdown */}
        <div className="col-span-6 sm:col-span-2">
          <label className="text-xs font-medium text-slate-700 mb-1 block">ประเภทกิจกรรม (Enum)</label>
          <select
            value={row.event_type ?? 'activity'}
            onChange={(e) => onChange('event_type', e.target.value)}
            className={rowInput()}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-white text-slate-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div className="col-span-6 sm:col-span-2">
          <label className="text-xs font-medium text-slate-700 mb-1 block">วันเริ่มต้น *</label>
          <input
            type="date"
            value={row.start_date ?? ''}
            onChange={(e) => onChange('start_date', e.target.value)}
            className={rowInput(row._error?.includes('start_date'))}
          />
        </div>

        {/* End date */}
        <div className="col-span-6 sm:col-span-2">
          <label className="text-xs font-medium text-slate-700 mb-1 block">วันสิ้นสุด *</label>
          <input
            type="date"
            value={row.end_date ?? ''}
            onChange={(e) => onChange('end_date', e.target.value)}
            className={rowInput(row._error?.includes('end_date'))}
          />
        </div>

        {/* Academic Term */}
        <div className="col-span-5 sm:col-span-1">
          <label className="text-xs font-medium text-slate-700 mb-1 block">ภาคเรียน</label>
          <input
            type="text"
            value={row.academic_term ?? ''}
            onChange={(e) => onChange('academic_term', e.target.value)}
            placeholder="1/2569"
            className={rowInput()}
          />
        </div>

        {/* Remove Button */}
        <div className="col-span-1 flex items-end justify-end pb-0.5">
          <button
            onClick={onRemove}
            title="ลบรายการนี้"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-5 cursor-pointer"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Error message */}
      {row._error && (
        <p className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1">
          <span>⚠️ {row._error}</span>
        </p>
      )}

      {/* Type badge preview */}
      {!row._error && (
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
        </div>
      )}
    </div>
  );
}

// 🟢 ปรับแต่งสไตล์ Input ให้รองรับ Dark Background และตัวอักษรสีขาวสว่าง
function rowInput(hasError) {
  return `w-full px-3 py-1.5 text-xs rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500
    bg-white text-slate-900 placeholder-slate-400 font-normal
    ${hasError ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-300 hover:border-slate-400'}`;
}

function validateRow(row) {
  if (!row.title?.trim()) return 'title: กรุณากรอกชื่อกิจกรรม';
  if (!row.start_date) return 'start_date: กรุณากรอกวันเริ่มต้น';
  if (!row.end_date) return 'end_date: กรุณากรอกวันสิ้นสุด';
  if (row.start_date && row.end_date && row.end_date < row.start_date)
    return 'end_date: วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น';
  return null;
}

function XIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}