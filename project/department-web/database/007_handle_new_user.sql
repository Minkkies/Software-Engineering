-- 003_handle_new_user.sql : สร้าง profile อัตโนมัติเมื่อมี user ใหม่ใน auth.users (รันซ้ำได้)
-- role ถูกตั้งเป็น 'student' เสมอ ไม่อ่านจาก metadata เพราะ metadata ที่มาจาก signUp
-- ผู้ใช้แก้เองได้ ถ้าเชื่อ metadata ใครก็สมัครเป็น admin ได้
-- การตั้ง role อื่นให้ทำผ่านหน้า admin (API ฝั่ง server) เท่านั้น

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, student_id, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'student_id', '')), ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
