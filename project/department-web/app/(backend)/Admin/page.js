// app/(backend)/Admin/page.js
// 🟢 [แก้ไข]: นำเข้า Supabase client และ DashBoard component 
import DashBoard from './DashBoard';
import { createClient } from '@lib/supabase/server';

export const revalidate = 0;

function buildNewsViews(news) {
    const now = new Date();
    const bangkokParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'numeric',
    }).formatToParts(now);
    const currentYear = Number(bangkokParts.find((part) => part.type === 'year').value);
    const currentMonth = Number(bangkokParts.find((part) => part.type === 'month').value) - 1;
    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(currentYear, currentMonth - 5 + index, 1);
        const year = date.getFullYear();
        const month = date.getMonth();
        const views = news
            .filter((item) => {
                const dateValue = item.created_at;
                const parts = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Asia/Bangkok',
                    year: 'numeric',
                    month: 'numeric',
                }).formatToParts(new Date(dateValue));
                return Number(parts.find((part) => part.type === 'year').value) === year
                    && Number(parts.find((part) => part.type === 'month').value) - 1 === month;
            })
            .reduce((total, item) => total + (item.views ?? 0), 0);

        return {
            label: date.toLocaleDateString('th-TH', { month: 'short' }),
            year,
            month: String(month + 1).padStart(2, '0'),
            views,
        };
    });
}

export default async function AdminCalendarPage() {
    let stats = {
        students: 0,
        publishedNews: 0,
        monthlyActivities: 0,
        trends: { students: 0, publishedNews: 0, activities: 0 }
    };

    let newsViews = buildNewsViews([]);

    const supabase = await createClient();
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthIso = currentMonth.toISOString();
    const previousMonthIso = previousMonth.toISOString();
    const nextMonthIso = nextMonth.toISOString();

    const [
        { data: profiles, error: profilesError },
        { data: news, error: newsError },
        { count: currentActivities, error: currentActivitiesError },
        { count: previousActivities, error: previousActivitiesError },
    ] = await Promise.all([
        supabase.from('profiles').select('role, is_active, created_at'),
        supabase.from('news').select('created_at, publish_at, views, status'),
        supabase.from('calendar_events').select('*', { count: 'exact', head: true })
            .gte('start_date', currentMonthIso.slice(0, 10))
            .lt('start_date', nextMonthIso.slice(0, 10)),
        supabase.from('calendar_events').select('*', { count: 'exact', head: true })
            .gte('start_date', previousMonthIso.slice(0, 10))
            .lt('start_date', currentMonthIso.slice(0, 10)),
    ]);

    if (profilesError) {
        console.error('โหลดสถิตินักศึกษาไม่สำเร็จ:', profilesError.message);
    } else {
        const students = (profiles ?? []).filter((profile) => profile.role === 'student' && profile.is_active);
        const previousStudents = students.filter((profile) => {
            const created = new Date(profile.created_at);
            return created < currentMonth;
        }).length;
        stats.students = students.length;
        stats.trends.students = previousStudents
            ? Math.round(((students.length - previousStudents) / previousStudents) * 100)
            : 0;
    }

    if (newsError) {
        console.error('โหลดสถิติข่าวไม่สำเร็จ:', newsError.message);
    } else {
        const publishedNews = (news ?? []).filter((item) => item.status === 'published');
        const previousPublishedNews = publishedNews.filter((item) => new Date(item.created_at) < currentMonth).length;
        stats.publishedNews = publishedNews.length;
        stats.trends.publishedNews = previousPublishedNews
            ? Math.round(((publishedNews.length - previousPublishedNews) / previousPublishedNews) * 100)
            : 0;
        newsViews = buildNewsViews(news ?? []);
    }

    if (currentActivitiesError || previousActivitiesError) {
        console.error(
            'โหลดสถิติกิจกรรมไม่สำเร็จ:',
            currentActivitiesError?.message || previousActivitiesError?.message
        );
    } else {
        stats.monthlyActivities = currentActivities ?? 0;
        stats.trends.activities = previousActivities
            ? Math.round((((currentActivities ?? 0) - previousActivities) / previousActivities) * 100)
            : 0;
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