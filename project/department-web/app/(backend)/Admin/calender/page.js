// app/(backend)/Admin/calender/page.js
// Server Component — Calendar Data Fetching

import { createClient } from '@supabase/supabase-js';
import CalenderClient from './CalenderClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Admin — Calendar Management | CS Info Portal',
  description: 'Manage academic calendar events for CS Info Portal',
};

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let events = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    events = await fetchCalendarEvents(supabase);
  }

  return (
    <CalenderClient
      initialEvents={events}
      adminUser={null}
    />
  );
}