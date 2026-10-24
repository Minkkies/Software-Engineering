-- 003_teacher_read_news.sql : อาจารย์ (teacher) ดูข่าวได้ทุกสถานะ (ร่าง/หมดอายุ) แต่แก้ไขไม่ได้
-- ไฟล์แนบ (news_attachments) ตามไปอัตโนมัติ เพราะ policy ของมันอ้างอิงสิทธิ์อ่านข่าว

drop policy if exists news_teacher_read on public.news;
create policy news_teacher_read on public.news for select to authenticated
  using ((select public.get_my_role()) = 'teacher');