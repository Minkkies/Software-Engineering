'use client';

// components/DeleteConfirmModal.jsx

import { ModalOverlay } from './EventModal';
import { Spinner } from './CalenderClient';

export default function DeleteConfirmModal({ event, onConfirm, onClose, loading }) {
  if (!event) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h3 className="text-center font-semibold text-gray-900 dark:text-gray-50 mb-1">
          ยืนยันการลบกิจกรรม
        </h3>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-1">
          คุณต้องการลบกิจกรรม
        </p>
        <p className="text-center text-sm font-medium text-gray-800 dark:text-gray-200 mb-5 line-clamp-2 px-2">
          "{event.title}"
        </p>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-6">
          การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
          >
            {loading && <Spinner className="w-4 h-4" />}
            ลบกิจกรรม
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}