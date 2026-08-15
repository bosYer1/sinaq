alter table public.club_images
  drop constraint if exists chk_club_images_storage_url;

alter table public.club_images
  add constraint chk_club_images_storage_url
  check (
    url ~ '^https://uxcedpbumulpheglhlvs\.supabase\.co/storage/v1/object/public/club-images/'
  );