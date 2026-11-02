-- 001_course_module.sql — Script อัปเดต Schema และ Function สำหรับโมดูล Course

-- 1) ปรับปรุง Constraints และเพิ่มคอลัมน์ประวัติการแก้ไขในตาราง courses
alter table public.courses drop constraint if exists courses_code_key;
alter table public.courses add constraint courses_code_semester_key unique (code, semester);
alter table public.courses add column if not exists exam_info text;
alter table public.courses add column if not exists notes text;       -- "เดิม ..." revision history

-- 2) ปรับปรุงตาราง course_schedules รองรับประเภทคาบ (LEC/LAB) และรายชื่ออาจารย์หลายคน
alter table public.course_schedules add column if not exists session_type text check (session_type in ('LEC','LAB'));
alter table public.course_schedules add column if not exists instructor_names text[] not null default '{}';

-- 3) สร้างตาราง mr30_documents สำหรับจัดเก็บเอกสาร มร.30 แยกตามภาคการศึกษา
create table if not exists public.mr30_documents (
                                                     id uuid primary key default gen_random_uuid(),
    semester text not null,
    title text not null,
    file_path text not null,
    file_size bigint,
    status text not null default 'pending' check (status in ('pending','published','archived')),
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
    );
create index if not exists mr30_documents_semester_idx on public.mr30_documents (semester);

-- 4) ฟังก์ชันสำหรับเขียนทับข้อมูลตารางเรียนประจำภาคการศึกษาแบบ Transactional
create or replace function public.replace_term_courses(p_semester text, p_payload jsonb)
returns int language plpgsql security invoker as $$
declare
c jsonb;
  s jsonb;
  cid uuid;
  n int := 0;
begin
  -- ลบข้อมูลวิชาเดิมในเทอมนั้น (ตาราง course_schedules จะถูกลบตามเนื่องจากมี ON DELETE CASCADE)
delete from public.courses where semester = p_semester;

-- วน ลูปนำเข้าข้อมูลวิชาใหม่
for c in select * from jsonb_array_elements(p_payload) loop
    insert into public.courses (code, name_th, name_en, credits, semester, exam_info, notes, is_open)
         values (
             c->>'code',
             c->>'name_th',
             c->>'name_en',
             coalesce((c->>'credits')::smallint, 3),
             p_semester,
             c->>'exam_info',
             c->>'notes',
             true
             )
             returning id into cid;

n := n + 1;

    -- วนลูปนำเข้าช่วงเวลาเรียนของแต่ละวิชา
for s in select * from jsonb_array_elements(coalesce(c->'slots','[]'::jsonb)) loop
    insert into public.course_schedules
         (course_id, day_of_week, start_time, end_time, room, teacher_id, session_type, instructor_names)
         values (
             cid,
             (s->>'day_of_week')::smallint,
             (s->>'start_time')::time,
             (s->>'end_time')::time,
             s->>'room',
             nullif(s->>'teacher_id','')::uuid,
             s->>'session_type',
             coalesce(array(select jsonb_array_elements_text(s->'instructor_names')), '{}')
             );
end loop;
end loop;

return n;
end $$;