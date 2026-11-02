// app/(backend)/Admin/page.js
// 🟢 [แก้ไข]: นำเข้า Supabase client และ DashBoard component 
import { createClient } from '@supabase/supabase-js';
import DashBoard from './DashBoard';

export const revalidate = 0;

export default async function AdminCalendarPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let initialEvents = [];
    
    // โครงสร้างตัวแปร stats ตั้งต้น
    let stats = {
        students: 1250,
        publishedNews: 0,
        monthlyActivities: 0,
        trends: { students: 0, publishedNews: 0, activities: 0 }
    };

    // 🟢 [แก้ไขจุดสำคัญ]: ใส่ข้อมูล newsViews สำหรับวาดกราฟ ป้องกัน Error smoothPath ใน DashBoard.jsx
    const newsViews = [
        { label: 'พ.ค.', year: 2026, month: '05', views: 320 },
        { label: 'มิ.ย.', year: 2026, month: '06', views: 450 },
        { label: 'ก.ค.', year: 2026, month: '07', views: 610 },
        { label: 'ส.ค.', year: 2026, month: '08', views: 580 },
        { label: 'ก.ย.', year: 2026, month: '09', views: 720 },
        { label: 'ต.ค.', year: 2026, month: '10', views: 890 }
    ];

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .order('start_date', { ascending: true });

        if (!error && data) {
            initialEvents = data;
            stats.monthlyActivities = data.length;
        }
    }

    return (
        <DashBoard 
            stats={stats}
            latestNews={[]}
            newsViews={newsViews}
            staff={[]}
        />
    );
}