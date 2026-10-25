-- 006_news_delete_policy.sql : ยืนยันสิทธิ์ลบข่าวและไฟล์แนบ

drop policy if exists news_staff_all on public.news;
create policy news_staff_all
  on public.news for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists news_att_staff_all on public.news_attachments;
create policy news_att_staff_all
  on public.news_attachments for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));
