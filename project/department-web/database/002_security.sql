-- 002_security.sql : ฟังก์ชันช่วย, trigger, สิทธิ์ และ Row Level Security (RLS)

-- ---------- ล้าง audit log เดิม ----------
do $$
declare t text;
begin
  foreach t in array array['news', 'courses', 'course_schedules', 'faculty_members', 'calendar_events', 'profiles', 'news_categories']
  loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('drop trigger if exists trg_audit_ins_del on public.%I', t);
      execute format('drop trigger if exists trg_audit_upd on public.%I', t);
    end if;
  end loop;
end $$;
drop function if exists public.log_audit();

-- ---------- ฟังก์ชันช่วย ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.get_my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.get_my_role() = 'admin', false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.get_my_role() in ('admin', 'staff'), false)
$$;

-- เพิ่มยอดอ่านข่าว (ให้ผู้เข้าชมเรียกได้โดยไม่ต้องมีสิทธิ์แก้ข่าว)
create or replace function public.increment_news_views(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.news set views = views + 1 where id = p_id and status = 'published'
$$;

-- สมัครสมาชิกใน Supabase Auth แล้วสร้าง profile ให้อัตโนมัติ (role เริ่มต้น = student)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at อัตโนมัติ ----------
drop trigger if exists trg_news_updated on public.news;
drop trigger if exists trg_courses_updated on public.courses;
drop trigger if exists trg_faculty_updated on public.faculty_members;
drop trigger if exists trg_calendar_updated on public.calendar_events;
create trigger trg_news_updated     before update on public.news            for each row execute function public.set_updated_at();
create trigger trg_courses_updated  before update on public.courses         for each row execute function public.set_updated_at();
create trigger trg_faculty_updated  before update on public.faculty_members for each row execute function public.set_updated_at();
create trigger trg_calendar_updated before update on public.calendar_events for each row execute function public.set_updated_at();

-- ---------- สิทธิ์ระดับตาราง (RLS จะกรองต่ออีกชั้น) ----------
grant usage on schema public to anon, authenticated;
grant select on public.news, public.news_attachments, public.faculty_members, public.courses,
                public.course_documents, public.course_schedules, public.calendar_events to anon;
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.increment_news_views(uuid) to anon, authenticated;

-- ---------- เปิด RLS ----------
alter table public.profiles              enable row level security;
alter table public.faculty_members       enable row level security;
alter table public.news                  enable row level security;
alter table public.news_attachments      enable row level security;
alter table public.courses               enable row level security;
alter table public.course_documents      enable row level security;
alter table public.course_schedules      enable row level security;
alter table public.student_courses       enable row level security;
alter table public.calendar_events       enable row level security;
alter table public.contact_messages      enable row level security;
alter table public.notification_settings enable row level security;

-- ---------- ล้าง policy เดิมเมื่อ migration นี้ถูกรันซ้ำ ----------
do $$
declare p record;
begin
  for p in
    select policyname, schemaname, tablename
    from pg_policies
    where schemaname = 'public'
      and policyname in (
        'profiles_select', 'profiles_update_own', 'profiles_admin_all',
        'news_public_read', 'news_staff_all',
        'news_att_public_read', 'news_att_staff_all',
        'faculty_public_read', 'faculty_staff_all', 'faculty_update_own',
        'courses_public_read', 'courses_staff_all',
        'course_docs_public_read', 'course_docs_staff_all',
        'schedules_public_read', 'schedules_staff_all',
        'student_courses_own',
        'calendar_public_read', 'calendar_staff_all',
        'contact_insert', 'contact_staff_read', 'contact_staff_update',
        'notif_own'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- ---------- profiles ----------
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- แก้ข้อมูลตัวเองได้ แต่เปลี่ยน role ตัวเองไม่ได้
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select public.get_my_role()));
create policy profiles_admin_all on public.profiles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- ข่าว: คนทั่วไปเห็นเฉพาะที่เผยแพร่แล้วและยังไม่หมดอายุ ----------
create policy news_public_read on public.news for select to anon, authenticated
  using (status = 'published'
         and (publish_at is null or publish_at <= now())
         and (expire_at  is null or expire_at  >  now()));
create policy news_staff_all on public.news for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- subquery บน news ถูกกรองด้วย RLS ของ news อยู่แล้ว
create policy news_att_public_read on public.news_attachments for select to anon, authenticated
  using (exists (select 1 from public.news n where n.id = news_id));
create policy news_att_staff_all on public.news_attachments for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------- อาจารย์ ----------
create policy faculty_public_read on public.faculty_members for select to anon, authenticated
  using (is_active);
create policy faculty_staff_all on public.faculty_members for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
-- อาจารย์แก้ข้อมูลของตัวเอง (FR-19b)
-- shortcut: policy คุมได้ระดับแถว ไม่ใช่ระดับคอลัมน์ ถ้าต้องจำกัดให้แก้ได้เฉพาะเวลาให้คำปรึกษา/ช่องทางติดต่อ ให้ทำผ่าน RPC
create policy faculty_update_own on public.faculty_members for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- ---------- รายวิชา / ตารางเรียน ----------
create policy courses_public_read on public.courses for select to anon, authenticated using (is_open);
create policy courses_staff_all on public.courses for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy course_docs_public_read on public.course_documents for select to anon, authenticated using (true);
create policy course_docs_staff_all on public.course_documents for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy schedules_public_read on public.course_schedules for select to anon, authenticated using (true);
create policy schedules_staff_all on public.course_schedules for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy student_courses_own on public.student_courses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- ปฏิทิน ----------
create policy calendar_public_read on public.calendar_events for select to anon, authenticated using (true);
create policy calendar_staff_all on public.calendar_events for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------- ติดต่อเจ้าหน้าที่ ----------
-- shortcut: ใครก็ส่งได้ (รวมคนไม่ล็อกอิน) ยังไม่มี rate limit ถ้าโดน spam ให้เพิ่ม captcha
create policy contact_insert on public.contact_messages for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = (select auth.uid())));
create policy contact_staff_read on public.contact_messages for select to authenticated
  using ((select public.is_staff()));
create policy contact_staff_update on public.contact_messages for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------- แจ้งเตือน ----------
create policy notif_own on public.notification_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 003_teacher_read_news.sql : อาจารย์ (teacher) ดูข่าวได้ทุกสถานะ (ร่าง/หมดอายุ) แต่แก้ไขไม่ได้
-- ไฟล์แนบ (news_attachments) ตามไปอัตโนมัติ เพราะ policy ของมันอ้างอิงสิทธิ์อ่านข่าว

create policy news_teacher_read on public.news for select to authenticated
  using ((select public.get_my_role()) = 'teacher');