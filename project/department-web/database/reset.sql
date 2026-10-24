-- reset.sql : ลบทุกอย่างที่สร้างจาก 001-002 เพื่อเริ่มใหม่ (ข้อมูลหายหมด! ใช้เฉพาะตอนพัฒนา)
-- ใช้: npm run db:run -- reset.sql   แล้วตามด้วย   npm run db:run

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.notification_settings, public.contact_messages,
  public.calendar_events, public.student_courses, public.course_schedules, public.course_documents,
  public.courses, public.news_attachments, public.news, public.faculty_members, public.profiles,
  public._migrations cascade;
drop function if exists public.handle_new_user(), public.increment_news_views(uuid),
  public.is_staff(), public.is_admin(), public.get_my_role(), public.set_updated_at();
drop type if exists public.contact_status, public.event_type, public.news_status, public.user_role;
