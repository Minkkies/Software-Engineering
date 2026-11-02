// app/(backend)/Admin/course/schedule/page.js — Server Component: list of terms derived from courses.semester
import { requireAdmin } from '../../../../../lib/courseSupabase';
import ScheduleTermClient from './ScheduleTermClient';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('semester, updated_at, course_schedules(id)')
    .not('semester', 'is', null);

  if (error) {
    console.error('Error fetching course schedules:', error);
  }

  const byTerm = {};
  
  for (const c of data ?? []) {
    if (!c.semester) continue;

    const t = (byTerm[c.semester] ??= { 
      semester: c.semester, 
      courses: 0, 
      slots: 0, 
      updated: c.updated_at || '' 
    });
    
    t.courses += 1;
    
    // ✅ 1. ป้องกัน TypeError: คำนวณ slots โดยเช็คว่า course_schedules เป็น Array หรือไม่
    const scheduleCount = Array.isArray(c.course_schedules) 
      ? c.course_schedules.length 
      : (c.course_schedules ? 1 : 0);
      
    t.slots += scheduleCount;
    
    if (c.updated_at && c.updated_at > t.updated) {
      t.updated = c.updated_at;
    }
  }

  const terms = Object.values(byTerm).sort((a, b) => { // newest term first: year desc, then term desc
    // ✅ 2. ป้องกัน Split Error กรณี semester ไม่มี '/'
    const [ta = '0', ya = '0'] = (a.semester || '').split('/');
    const [tb = '0', yb = '0'] = (b.semester || '').split('/');
    return (Number(yb) || 0) - (Number(ya) || 0) || (Number(tb) || 0) - (Number(ta) || 0);
  });

  // ✅ 3. การันตีว่าส่ง Array (อย่างน้อยเป็น []) ไปยัง Client Component เสมอ
  return <ScheduleTermClient terms={terms || []} />;
}