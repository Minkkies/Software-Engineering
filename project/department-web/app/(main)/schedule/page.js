import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublishedMr30Url } from '../../../lib/mr30';
import ScheduleClient from './ScheduleClient';

export default async function SchedulePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
          <p className="font-bold text-base">⚠️ อ่านค่า Supabase Key ไม่พบ</p>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });

  let serverError = null;
  let user = null;
  let profile = null;
  let branchCourses = [];
  let enrollments = [];
  let mr30Url = null;

  try {
    // 1. Auth Check
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw new Error(`Auth Error: ${authErr.message}`);
    user = authData?.user;

    if (!user) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <p className="font-semibold">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
          </div>
        </div>
      );
    }

    // 2. Profile Fetch
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id')
      .eq('id', user.id)
      .maybeSingle();

    profile = profData;

    // 3. ดึงวิชาในสาขาที่เปิดสอนทั้งหมด (เอา .eq('semester', ...) ออกเพื่อดึงวิชาทั้งหมดใน DB มาลองก่อน)
    const { data: bCourses, error: bErr } = await supabase
      .from('courses')
      .select(`
        id,
        code,
        name_th,
        name_en,
        credits,
        semester,
        course_schedules (
          id,
          session_type,
          day_of_week,
          start_time,
          end_time,
          room,
          instructor_names
        )
      `);

    if (bErr) throw new Error(`Fetch Courses Error: ${bErr.message}`);
    branchCourses = bCourses || [];

    // กำหนดภาคเรียนจากวิชาตัวแรกที่ดึงได้ หรือใช้ 1/2567
    const currentSemester = branchCourses[0]?.semester || '1/2567';

    // 4. Fetch PDF มร.30
    try {
      mr30Url = await getPublishedMr30Url(supabase, currentSemester);
    } catch (e) {}

    // 5. Fetch วิชาที่นักศึกษาลงตารางเรียนไว้
    const { data: enrData, error: enrErr } = await supabase
      .from('student_enrollments')
      .select(`
        id,
        source,
        custom_course_code,
        custom_course_name,
        custom_credits,
        custom_sessions,
        custom_exam,
        courses (
          id,
          code,
          name_th,
          credits,
          course_schedules (
            id,
            session_type,
            day_of_week,
            start_time,
            end_time,
            room,
            instructor_names
          )
        )
      `)
      .eq('student_id', user.id);

    if (enrErr) console.error('⚠️ Enrollments Fetch Warning:', enrErr.message);
    enrollments = enrData || [];

  } catch (err) {
    console.error('❌ Server Fetch Error:', err);
    serverError = err.message;
  }

  const mappedCourses = enrollments.map((item) => {
    if (item.source === 'mr30') {
      return {
        id: item.id,
        enrollment_id: item.id,
        code: item.custom_course_code,
        name: item.custom_course_name,
        credits: item.custom_credits || 3,
        source: 'mr30',
        sessions: item.custom_sessions || [],
        exam: item.custom_exam || null,
      };
    }

    return {
      id: item.courses?.id || item.id,
      enrollment_id: item.id,
      code: item.courses?.code || 'N/A',
      name: item.courses?.name_th || 'รายวิชาในสาขา',
      credits: item.courses?.credits || 3,
      source: 'branch',
      sessions: item.courses?.course_schedules || [],
      exam: null,
    };
  });

  const studentInfo = {
    name: profile?.full_name || user?.user_metadata?.full_name || 'นักศึกษา',
    code: profile?.student_id || user?.user_metadata?.student_id || '6605005300',
    faculty: 'สาขาวิทยาการคอมพิวเตอร์',
  };

  return (
    <ScheduleClient
      initialSemester={branchCourses[0]?.semester || '1/2567'}
      student={studentInfo}
      initialCourses={mappedCourses}
      availableBranchCourses={branchCourses}
      mr30Url={mr30Url}
      userId={user?.id}
      serverError={serverError}
    />
  );
}