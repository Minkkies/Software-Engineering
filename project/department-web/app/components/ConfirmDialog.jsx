"use client";

import { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, title, message, confirmLabel = "ยืนยัน", onConfirm, onCancel, loading = false }) {
    const cancelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        cancelRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === "Escape" && !loading) onCancel();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, loading, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) onCancel();
        }}>
            <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600" aria-hidden="true">
                    !
                </div>
                <h2 id="confirm-dialog-title" className="mt-4 text-xl font-bold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button ref={cancelRef} type="button" disabled={loading} onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
                        ยกเลิก
                    </button>
                    <button type="button" disabled={loading} onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {loading ? "กำลังลบ..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
