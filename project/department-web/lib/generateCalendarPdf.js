// lib/generateCalendarPdf.js

function formatThaiDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const monthName = thaiMonths[parseInt(m, 10) - 1] || '';
  const yearTH = parseInt(y, 10) + 543;
  return `${parseInt(d, 10)} ${monthName} ${yearTH}`;
}

function getEventTypeBadge(type) {
  switch (type) {
    case 'exam': return '<span style="color: #dc2626; background: #fee2e2; padding: 3px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #fca5a5;">สอบ</span>';
    case 'registration': return '<span style="color: #d97706; background: #fef3c7; padding: 3px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #fcd34d;">ลงทะเบียน</span>';
    case 'semester': return '<span style="color: #2563eb; background: #dbeafe; padding: 3px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #93c5fd;">ภาคเรียน</span>';
    default: return '<span style="color: #4b5563; background: #f3f4f6; padding: 3px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #e5e7eb;">กิจกรรม</span>';
  }
}

export async function generateCalendarPdf(termConfig, events = []) {
  try {
    const { default: html2pdf } = await import('html2pdf.js');

    // 1. ดึงข้อมูลที่ตรงตาม academic_term หรือช่วงวัน
    const filteredEvents = events.filter((e) => {
      if (termConfig.academicTerm && e.academic_term) {
        return e.academic_term === termConfig.academicTerm;
      }
      if (termConfig.startDate && termConfig.endDate && e.start_date) {
        return e.start_date >= termConfig.startDate && e.start_date <= termConfig.endDate;
      }
      return true;
    });

    // 2. สร้างโครงสร้างแถวข้อมูล
    const rowsHtml = filteredEvents.length > 0 ? filteredEvents.map((item, index) => {
      const dateText = item.start_date === item.end_date
        ? formatThaiDateShort(item.start_date)
        : `${formatThaiDateShort(item.start_date)} - ${formatThaiDateShort(item.end_date)}`;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; text-align: center; color: #4b5563; font-size: 13px;">${index + 1}</td>
          <td style="padding: 12px 8px; text-align: center; white-space: nowrap; font-weight: 600; color: #1f2937; font-size: 13px;">${dateText}</td>
          <td style="padding: 12px 8px; color: #111827; line-height: 1.5; font-size: 13px;">${item.title || item.description || '-'}</td>
          <td style="padding: 12px 8px; text-align: center; font-size: 12px;">${getEventTypeBadge(item.event_type)}</td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="4" style="padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">ไม่พบข้อมูลกิจกรรมในภาคการศึกษานี้</td>
      </tr>
    `;

    const pdfContent = document.createElement('div');
    pdfContent.style.cssText = 'position: fixed; left: 0; top: 0; z-index: 2147483647; width: 720px; min-height: 1020px; padding: 24px; box-sizing: border-box; visibility: visible; opacity: 1; color: #1f2937; background: #fff; font-family: Arial, sans-serif;';
    pdfContent.innerHTML = `
          <style>
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #d9534f; color: #fff; padding: 12px 8px; font-size: 14px; }
            tr:nth-child(even) { background: #f9fafb; }
          </style>
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 6px 0;">มหาวิทยาลัยรามคำแหง</h1>
            <h2 style="font-size: 16px; font-weight: 600; color: #4b5563; margin: 0;">ปฏิทินการศึกษา - ${termConfig.title}</h2>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">ลำดับ</th>
                <th style="width: 170px; text-align: center;">กำหนดวัน-เดือน-ปี</th>
                <th style="text-align: left;">รายการ / กิจกรรม</th>
                <th style="width: 90px; text-align: center;">ประเภท</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
    `;
    document.body.appendChild(pdfContent);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      const worker = html2pdf().set({
        margin: 15,
        filename: `ปฏิทินการศึกษา-${termConfig.academicTerm || termConfig.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          width: pdfContent.scrollWidth,
          height: pdfContent.scrollHeight,
        },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(pdfContent).toCanvas().toPdf();
      await worker.save();
    } finally {
      pdfContent.remove();
    }

  } catch (error) {
    console.error('PDF Generation Exception:', error);
    alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + error.message);
  }
}
