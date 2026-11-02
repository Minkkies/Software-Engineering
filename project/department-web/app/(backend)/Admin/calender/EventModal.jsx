'use client';

// components/EventModal.jsx
// Modal form for creating or editing a single calendar event

import { useState, useEffect } from 'react';
import { EVENT_TYPES } from './CalenderClient';
import { Spinner } from './CalenderClient';

const EMPTY_FORM = {
  title: '',
  description: '',
  event_type: 'activity',
  start_date: '',
  end_date: '',
  academic_term: '',
};

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'กรุณากรอกชื่อกิจกรรม';
  if (!form.start_date) errors.start_date = 'กรุณาเลือกวันเริ่มต้น';
  if (!form.end_date) errors.end_date = 'กรุณาเลือกวันสิ้นสุด';
  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    errors.end_date = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น';
  }
  return errors;
}

export default function EventModal({ mode, initialData, onSave, onClose, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        title: initialData.title ?? '',
        description: initialData.description ?? '',
        event_type: initialData.event_type ?? 'activity',
        start_date: initialData.start_date ?? '',
        end_date: initialData.end_date ?? '',
        academic_term: initialData.academic_term ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [mode, initialData]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave(form);
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">
            {mode === 'edit' ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <Field label="ชื่อกิจกรรม *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="เช่น รับสมัครนักศึกษาใหม่"
              className={inputClass(errors.title)}
            />
          </Field>

          {/* Description */}
          <Field label="รายละเอียด">
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={3}
              className={inputClass() + ' resize-none'}
            />
          </Field>

          {/* Event Type */}
          <Field label="ประเภทกิจกรรม *">
            <select
              value={form.event_type}
              onChange={(e) => handleChange('event_type', e.target.value)}
              className={inputClass()}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="วันเริ่มต้น *" error={errors.start_date}>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={inputClass(errors.start_date)}
              />
            </Field>
            <Field label="วันสิ้นสุด *" error={errors.end_date}>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className={inputClass(errors.end_date)}
              />
            </Field>
          </div>

          {/* Academic Term */}
          <Field label="ภาคการศึกษา">
            <input
              type="text"
              value={form.academic_term}
              onChange={(e) => handleChange('academic_term', e.target.value)}
              placeholder="เช่น 2/2569"
              className={inputClass()}
            />
          </Field>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60"
            >
              {loading && <Spinner className="w-4 h-4" />}
              {mode === 'edit' ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function ModalOverlay({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    ${hasError
      ? 'border-red-400 dark:border-red-500'
      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`;
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}