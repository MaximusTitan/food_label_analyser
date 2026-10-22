-- Label photos for scans. Photos live in a private bucket under a folder named
-- after the owner's user id ("<user_id>/<scan_id>.jpg"), and Storage policies
-- keep each user to their own folder. The app only ever hands out short-lived
-- signed URLs.

alter table public.scans
  add column image_path text
  check (
    image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    and split_part(image_path, '/', 1) = user_id::text
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scan-photos', 'scan-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users can read their own scan photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'scan-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can add their own scan photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'scan-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own scan photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'scan-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Photos are immutable like scans: no update policy.
