// app/(main)/course/page.js
import CourseClient from './CourseClient';
// 🟢 ดึง createClient จาก lib/supabase/server โดยตรง (แบบเดียวกับที่ courseSupabase.js ใช้)
import { createClient } from '../../../lib/supabase/server';

export const revalidate = 0; // ดึงข้อมูลล่าสุดเสมอ

export default async function CoursePage() {
  // สร้าง Supabase Instance สำหรับ Server Component
  const supabase = await createClient();

  // ดึงข้อมูลรายวิชาพร้อมตารางเรียน (course_schedules)
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('*, course_schedules(*)');

  // ดึงข้อมูลอาจารย์/คณะ
  const { data: faculty } = await supabase
    .from('faculty')
    .select('*');

  if (courseError) {
    console.error('Error fetching courses:', courseError);
  }

  return (
    <CourseClient 
      courses={courses || []} 
      faculty={faculty || []} 
    />
  );
}