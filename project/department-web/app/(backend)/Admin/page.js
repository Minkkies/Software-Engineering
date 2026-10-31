import { createClient } from '@supabase/supabase-js';
import AdminCalenderClient from './calender/CalenderClient';

// ป้องกัน Caching ให้ดึงข้อมูลล่าสุดจาก DB เสมอ
export const revalidate = 0;

export default async function AdminCalendarPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let initialEvents = [];

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .order('start_date', { ascending: true });

        if (!error && data) {
            initialEvents = data;
        }
    }

    return <AdminCalenderClient initialEvents={initialEvents} />;
}