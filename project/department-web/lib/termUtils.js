/**
 * คำนวณหาภาคการศึกษาไทยจาก start_date (ฟอร์แมต YYYY-MM-DD)
 * @param {string} dateStr - วันที่ เช่น "2024-06-15"
 * @returns {string} - ข้อความภาคการศึกษา เช่น "1/2567"
 */
export const deriveAcademicTerm = (dateStr) => {
  if (!dateStr) return '1/2569';
  
  const date = new Date(dateStr);
  const yearAD = date.getFullYear(); // ค.ศ.
  const month = date.getMonth() + 1; // เดือน 1-12
  
  let yearBE = yearAD + 543; // แปลงเป็น พ.ศ.
  let termNumber = '1';

  if (month >= 6 && month <= 10) {
    termNumber = '1';
  } else if (month >= 11) {
    termNumber = '2';
  } else if (month >= 1 && month <= 3) {
    termNumber = '2';
    yearBE = yearBE - 1; 
  } else if (month >= 4 && month <= 5) {
    termNumber = '3'; // ภาคฤดูร้อน (Summer)
    yearBE = yearBE - 1;
  }

  return `${termNumber}/${yearBE}`;
};