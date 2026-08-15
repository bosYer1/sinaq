drop policy if exists "admin_insert_club_images" on storage.objects;
drop policy if exists "admin_update_club_images" on storage.objects;
drop policy if exists "admin_delete_club_images" on storage.objects;

create policy "admin_insert_club_images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'club-images' and public.is_admin());

create policy "admin_update_club_images"
on storage.objects for update
to authenticated
using (bucket_id = 'club-images' and public.is_admin())
with check (bucket_id = 'club-images' and public.is_admin());

create policy "admin_delete_club_images"
on storage.objects for delete
to authenticated
using (bucket_id = 'club-images' and public.is_admin());