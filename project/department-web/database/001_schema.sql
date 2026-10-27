-- 001_schema.sql : ตารางหลักของระบบ CS Info Portal (อ้างอิงจากเอกสาร Requirement)

-- ---------- ENUM ----------
do $$
begin
  if to_regtype('public.user_role') is null then
    create type public.user_role as enum ('admin', 'staff', 'teacher', 'student');
  end if;
  if to_regtype('public.news_status') is null then
    create type public.news_status as enum ('draft', 'published', 'archived');
  end if;
  if to_regtype('public.event_type') is null then
    create type public.event_type as enum ('semester', 'exam', 'holiday', 'activity');
  end if;
  if to_regtype('public.contact_status') is null then
    create type public.contact_status as enum ('new', 'read', 'resolved');
  end if;
end $$;

-- ---------- บัญชีผู้ใช้ (ผูกกับ Supabase Auth: auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  student_id  text unique,
  role        public.user_role not null default 'student',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- ข้อมูลอาจารย์/เจ้าหน้าที่ ----------
create table public.faculty_members (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid unique references public.profiles(id) on delete set null,
  kind           text not null default 'teacher' check (kind in ('teacher', 'staff')),
  full_name      text not null,
  position       text,
  education      text,
  expertise      text,
  research       text,
  email          text,
  phone          text,
  office_room    text,
  consult_hours  text,
  photo_url      text,
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- ข่าวประกาศ ----------
create table public.news (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  summary       text,
  content       text,
  category      text,
  tags          text[] not null default '{}',
  author_id     uuid references public.profiles(id) on delete set null,
  status        public.news_status not null default 'draft',
  publish_at    timestamptz,
  expire_at     timestamptz,                 -- หมดอายุแล้วซ่อนอัตโนมัติ (ดู policy ใน 002)
  views         int not null default 0,
  show_on_home  boolean not null default false,
  pinned        boolean not null default false,
  cover_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (expire_at is null or publish_at is null or expire_at > publish_at)
);
create index news_listing_idx on public.news (status, publish_at desc);

create table public.news_attachments (
  id          uuid primary key default gen_random_uuid(),
  news_id     uuid not null references public.news(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,                 -- path ใน Supabase Storage
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);
create index news_attachments_news_idx on public.news_attachments (news_id);

-- ---------- รายวิชา / ตารางเรียน ----------
create table public.courses (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  name_th         text not null,
  name_en         text,
  credits         smallint not null check (credits between 0 and 12),
  description     text,
  line_group_url  text,
  semester        text,                      -- เช่น '1/2569'
  is_open         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.course_documents (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,                 -- เช่น มคอ.3, เอกสารประกอบการสอน
  file_path   text not null,
  created_at  timestamptz not null default now()
);
create index course_documents_course_idx on public.course_documents (course_id);

-- 1 แถว = 1 คาบเรียนของกลุ่มเรียน
create table public.course_schedules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  section      text not null default '1',
  day_of_week  smallint not null check (day_of_week between 1 and 7),  -- 1=จันทร์ ... 7=อาทิตย์
  start_time   time not null,
  end_time     time not null,
  room         text,
  teacher_id   uuid references public.faculty_members(id) on delete set null,
  created_at   timestamptz not null default now(),
  check (end_time > start_time)
);
create index course_schedules_course_idx on public.course_schedules (course_id, section);

-- ตารางเรียนส่วนตัวของนักศึกษา
create table public.student_courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  section     text not null default '1',
  created_at  timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------- ปฏิทินมหาวิทยาลัย ----------
create table public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  event_type   public.event_type not null default 'activity',
  start_date   date not null,
  end_date     date not null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_date >= start_date)
);
create index calendar_events_date_idx on public.calendar_events (start_date, end_date);
