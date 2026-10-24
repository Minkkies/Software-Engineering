-- 004_news_categories.sql : หมวดหมู่ข่าวเป็นตารางของตัวเอง เจ้าหน้าที่/แอดมินเพิ่ม-แก้-ลบได้

create table public.news_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- หมวดเริ่มต้นตามเอกสาร Requirement
insert into public.news_categories (name, sort_order) values
  ('ข่าวรับสมัคร', 1), ('ข่าวกิจกรรม', 2), ('ทุนการศึกษา', 3), ('ประกาศ', 4);

-- ย้ายค่า news.category (ข้อความเดิม) ไปเป็น category_id แล้วลบคอลัมน์เก่า
insert into public.news_categories (name)
  select distinct trim(category) from public.news
  where nullif(trim(category), '') is not null
  on conflict (name) do nothing;

alter table public.news add column category_id uuid references public.news_categories(id) on delete set null;
update public.news n set category_id = c.id from public.news_categories c where c.name = trim(n.category);
alter table public.news drop column category;
create index news_category_idx on public.news (category_id);

-- สิทธิ์ + RLS (ทุกคนอ่านได้ / แอดมินและเจ้าหน้าที่จัดการได้)
grant select on public.news_categories to anon;
grant select, insert, update, delete on public.news_categories to authenticated;
alter table public.news_categories enable row level security;

create policy news_cat_public_read on public.news_categories for select to anon, authenticated using (true);
create policy news_cat_staff_all on public.news_categories for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
