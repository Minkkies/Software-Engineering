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

export function generateCalendarPdf(termConfig, events = []) {
  try {
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

    // 3. เปิด Pop-up Window เพื่อ Print/Save PDF ภาษาไทย
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อพิมพ์เอกสาร PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ปฏิทินการศึกษา - ${termConfig.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Sarabun', sans-serif;
              padding: 24px;
              color: #1f2937;
              background-color: #fff;
            }
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th {
              background-color: #d9534f;
              color: #ffffff;
              padding: 12px 8px;
              font-size: 14px;
              font-weight: 700;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
          </style>
        </head>
        <body>
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

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

  } catch (error) {
    console.error('PDF Generation Exception:', error);
    alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + error.message);
  }
}