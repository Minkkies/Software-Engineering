-- 002_profiles_rls.sql : RLS ของตาราง profiles (รันซ้ำได้)

-- ฟังก์ชันตรวจว่าผู้ใช้ปัจจุบันเป็น admin
-- ต้องเป็น security definer ไม่เช่นนั้น policy ที่อ่าน profiles ซ้อนใน profiles จะวนลูป
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

alter table public.profiles enable row level security;

-- ผู้ใช้อ่าน profile ของตัวเองได้ (ใช้ตอน login และใน getSessionUser)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- admin อ่านได้ทุกแถว (หน้า UsersClient)
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (public.is_admin());

-- admin แก้ไขได้ (ปุ่มระงับ/เปิดใช้งานบัญชี)
-- ผู้ใช้ทั่วไปไม่มีสิทธิ์ update เพื่อกันการแก้ role ยกระดับตัวเอง
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
