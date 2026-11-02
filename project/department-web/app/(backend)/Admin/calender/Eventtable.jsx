'use client';

// app/(backend)/Admin/calender/Eventtable.jsx
import { getEventTypeConfig } from './CalenderClient';

export default function EventTable({ events = [], onEdit, onDelete, loading }) {
  if (loading && events.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลกิจกรรม...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <p className="text-slate-500 text-sm">ไม่พบข้อมูลกิจกรรมการศึกษา</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* หัวตารางโทนเทาอ่อน-น้ำเงิน สว่างตา */}
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-4">ชื่อกิจกรรม</th>
              <th className="py-3.5 px-4">ประเภท</th>
              <th className="py-3.5 px-4">วันเริ่มต้น</th>
              <th className="py-3.5 px-4">วันสิ้นสุด</th>
              <th className="py-3.5 px-4">ภาคการศึกษา</th>
              <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {events.map((item) => {
              const typeConfig = getEventTypeConfig(item.event_type);
              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* ชื่อกิจกรรม + รายละเอียด */}
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </td>

                  {/* ป้ายประเภทกิจกรรม (Badge โทนทอง/ส้ม/น้ำเงิน) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}
                    >
                      {typeConfig.label}
                    </span>
                  </td>

                  {/* วันเริ่มต้น */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                    {formatThaiDate(item.start_date)}
                  </td>

                  {/* วันสิ้นสุด */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                    {formatThaiDate(item.end_date)}
                  </td>

                  {/* ภาคการศึกษา (Badge ขาว-ทองอ่อน) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.academic_term ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.academic_term}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* ปุ่มแก้ไข / ลบ */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="แก้ไข"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onDelete?.(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="ลบ"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ฟังก์ชันแปลงวันที่เป็นภาษาไทยมาตรฐาน (เช่น 12 ม.ค. 2570)
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const yearBE = date.getFullYear() + 543;

  return `${day} ${month} ${yearBE}`;
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}