// app/(backend)/Admin/calender/page.js
// Server Component — Auth/Role Check & Server-side Data Fetching

import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import CalenderClient from './CalenderClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — Calendar Management | CS Info Portal',
  description: 'Manage academic calendar events for CS Info Portal',
};

async function getSessionAndRole(supabase) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) return { session: null, profile: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) return { session, profile: null };

  return { session, profile };
}

async function fetchCalendarEvents(supabase) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[Admin/calender] Failed to fetch events:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function AdminCalenderPage() {
  // 🟢 แก้ไขเรื่อง cookies() แบบ Callback ป้องกัน Next.js Async Cookies Warning/Error
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { session, profile } = await getSessionAndRole(supabase);

  // 1. ตรวจสอบการ Login
  if (!session) {
    redirect('/login?next=/Admin/calender');
  }

  // 2. Role guard — อนุญาตเฉพาะ admin หรือ superadmin
  if (!profile || !['admin', 'superadmin'].includes(profile?.role)) {
    redirect('/unauthorized');
  }

  // 3. ดึงข้อมูลปฏิทินส่งฝั่ง Client
  const events = await fetchCalendarEvents(supabase);

  return (
    <CalenderClient
      initialEvents={events}
      adminUser={{
        id: session.user.id,
        email: session.user.email,
        fullName: profile?.full_name ?? session.user.email,
        role: profile?.role,
      }}
    />
  );
}