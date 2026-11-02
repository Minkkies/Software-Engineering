'use client';

// app/(backend)/Admin/calender/CalenderClient.jsx
// Client Component — Admin Calendar Management Dashboard

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import EventTable from './Eventtable';
import EventModal from './EventModal';
import PdfImportModal from './Pdfimportmodal';
import BulkPreviewModal from './Bulkpreviewmodal';
import CustomerPreview from './Customerpreview';
import Toast from './Toast';
import Button from "@components/button";
import ConfirmDialog from "@components/ConfirmDialog";

// ---------------------------------------------------------------------------
// Supabase client (publishable/anon key — safe for client-side)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ---------------------------------------------------------------------------
// Constants (ตรงตาม Enum ใน Supabase 6 ค่า: semester, exam, holiday, activity, registration, academic)
// 📌 [จุดที่แก้ไขธีม]: ปรับสี Badge ให้เป็นโทนสว่าง + คุมโทนส้มทอง/น้ำเงิน สอดคล้องกับภาพธีมหลัก
// ---------------------------------------------------------------------------
export const EVENT_TYPES = [
  { value: 'semester',     label: 'ภาคการศึกษา',    color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'exam',         label: 'สอบ',             color: 'bg-red-50 text-red-700 border border-red-200' },
  { value: 'holiday',      label: 'วันหยุด',         color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  { value: 'activity',     label: 'กิจกรรม',         color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'registration', label: 'กำหนดการกิจกรรม', color: 'bg-amber-100 text-amber-800 border border-amber-300' },
  { value: 'academic',     label: 'วิชาการ',         color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
];

export function getEventTypeConfig(value) {
  return EVENT_TYPES.find((t) => t.value === value) ?? EVENT_TYPES[3];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CalenderClient({ initialEvents = [], adminUser }) {
  // ----- View state --------------------------------------------------------
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'preview'

  // ----- Data state --------------------------------------------------------
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);

  // ----- Filter/search state -----------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  // ----- Modal state -------------------------------------------------------
  const [eventModal, setEventModal] = useState({ open: false, mode: 'create', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, event: null });
  const [pdfModal, setPdfModal]     = useState(false);
  const [bulkModal, setBulkModal]   = useState({ open: false, parsed: [] });

  // ----- Toast state -------------------------------------------------------
  const [toast, setToast] = useState(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      showToast('ไม่สามารถโหลดข้อมูลได้: ' + error.message, 'error');
    } else {
      setEvents(data ?? []);
    }
    setLoading(false);
  }, [showToast]);

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleSaveEvent = useCallback(
    async (formData) => {
      setLoading(true);
      const isEdit = eventModal.mode === 'edit';
      let error;

      const payload = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type || 'activity',
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        academic_term: formData.academic_term || null,
        ...(adminUser?.id ? { created_by: adminUser.id } : {}),
      };

      if (isEdit) {
        const { error: e } = await supabase
          .from('calendar_events')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', eventModal.data.id);
        error = e;
      } else {
        const { error: e } = await supabase
          .from('calendar_events')
          .insert(payload);
        error = e;
      }

      if (error) {
        showToast('บันทึกล้มเหลว: ' + error.message, 'error');
      } else {
        showToast(isEdit ? 'อัปเดตกิจกรรมเรียบร้อย' : 'เพิ่มกิจกรรมเรียบร้อย');
        setEventModal({ open: false, mode: 'create', data: null });
        await refreshEvents();
      }
      setLoading(false);
    },
    [eventModal, adminUser, refreshEvents, showToast]
  );

  const handleDeleteEvent = useCallback(
    async (event) => {
      setLoading(true);
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id);

      if (error) {
        showToast('ลบล้มเหลว: ' + error.message, 'error');
      } else {
        showToast('ลบกิจกรรมเรียบร้อย');
        setDeleteModal({ open: false, event: null });
        await refreshEvents();
      }
      setLoading(false);
    },
    [refreshEvents, showToast]
  );

  const handleBulkSave = useCallback(
    async (parsedEvents) => {
      setLoading(true);
      const payload = parsedEvents.map((e) => ({
        title: e.title || 'ไม่มีชื่อกิจกรรม',
        description: e.description || e.title || null,
        event_type: e.event_type || 'activity',
        start_date: e.start_date,
        end_date: e.end_date || e.start_date,
        academic_term: e.academic_term || null,
        ...(adminUser?.id ? { created_by: adminUser.id } : {}),
      }));

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(payload)
        .select();

      if (error) {
        showToast('บันทึกชุดข้อมูลล้มเหลว: ' + error.message, 'error');
      } else {
        showToast(`บันทึก ${data?.length || payload.length} รายการเรียบร้อย`);
        setBulkModal({ open: false, parsed: [] });
        await refreshEvents();
      }
      setLoading(false);
    },
    [adminUser, refreshEvents, showToast]
  );

  // ---------------------------------------------------------------------------
  // Filtered events (memoised)
  // ---------------------------------------------------------------------------
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        ev.title?.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q);
      const matchesType = !filterType || ev.event_type === filterType;
      const matchesTerm = !filterTerm || ev.academic_term === filterTerm;
      return matchesSearch && matchesType && matchesTerm;
    });
  }, [events, searchQuery, filterType, filterTerm]);

  const uniqueTerms = useMemo(
    () => [...new Set(events.map((e) => e.academic_term).filter(Boolean))].sort(),
    [events]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    // 📌 [จุดที่แก้ไขธีม]: เปลี่ยนพื้นหลังสว่าง bg-slate-50 ถอด dark:bg-... ออกทั้งหมด
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ---- Header ---- */}
      <div>
        <div className="max-w-screen-xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              ระบบจัดการปฏิทินการศึกษา
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              จัดการกิจกรรม ตรวจสอบ และนำเข้าข้อมูลปฏิทินประจำปีการศึกษา
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab Toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')}>
                ตารางข้อมูล
              </TabButton>
              <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
                ตัวอย่างหน้านักศึกษา
              </TabButton>
            </div>

            {activeTab === 'table' && (
              <>
                <Button icon="upload" variant="outline" onClick={() => setPdfModal(true)}>
                  นำเข้า PDF
                </Button >

                <Button icon="plus" onClick={() => setEventModal({ open: true, mode: 'create', data: null })}>
                  เพิ่มกิจกรรม
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {activeTab === 'table' ? (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อกิจกรรม หรือรายละเอียด..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="">ทุกประเภท</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="">ทุกภาคการศึกษา</option>
                {uniqueTerms.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Summary Bar */}
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 font-medium">
              <span>แสดง {filteredEvents.length} จาก {events.length} รายการ</span>
              {loading && <Spinner className="w-4 h-4" />}
            </div>

            {/* Event Table */}
            <EventTable
              events={filteredEvents}
              onEdit={(ev) => setEventModal({ open: true, mode: 'edit', data: ev })}
              onDelete={(ev) => setDeleteModal({ open: true, event: ev })}
              loading={loading}
            />
          </>
        ) : (
          <CustomerPreview events={events} />
        )}
      </div>

      {/* ---- Modals ---- */}
      {eventModal.open && (
        <EventModal
          mode={eventModal.mode}
          initialData={eventModal.data}
          onSave={handleSaveEvent}
          onClose={() => setEventModal({ open: false, mode: 'create', data: null })}
          loading={loading}
        />
      )}

      <ConfirmDialog
        open={deleteModal.open}
        title="ยืนยันการลบกิจกรรม"
        message={deleteModal.event
          ? `ต้องการลบกิจกรรม "${deleteModal.event.title}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
          : ""}
        confirmLabel="ลบกิจกรรม"
        onConfirm={() => handleDeleteEvent(deleteModal.event)}
        onCancel={() => setDeleteModal({ open: false, event: null })}
        loading={loading}
      />

      {pdfModal && (
        <PdfImportModal
          onClose={() => setPdfModal(false)}
          onParsed={(parsed) => {
            setPdfModal(false);
            setBulkModal({ open: true, parsed });
          }}
        />
      )}

      {bulkModal.open && (
        <BulkPreviewModal
          parsed={bulkModal.parsed}
          onSave={handleBulkSave}
          onClose={() => setBulkModal({ open: false, parsed: [] })}
          loading={loading}
        />
      )}

      {/* ---- Toast ---- */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
        active
          ? 'bg-white text-blue-600 shadow-sm font-semibold'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 10l-4-4m0 0L8 10m4-4v12" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

export function Spinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={`animate-spin text-blue-600 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}