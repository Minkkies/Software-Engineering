-- 005_news_storage.sql : Storage สำหรับปกข่าวและเอกสารแนบ

insert into storage.buckets (id, name, public)
values ('news-files', 'news-files', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists news_files_public_read on storage.objects;
create policy news_files_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'news-files');

drop policy if exists news_files_staff_insert on storage.objects;
create policy news_files_staff_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'news-files' and (select public.is_staff()));

drop policy if exists news_files_staff_update on storage.objects;
create policy news_files_staff_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'news-files' and (select public.is_staff()))
  with check (bucket_id = 'news-files' and (select public.is_staff()));

drop policy if exists news_files_staff_delete on storage.objects;
create policy news_files_staff_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'news-files' and (select public.is_staff()));
