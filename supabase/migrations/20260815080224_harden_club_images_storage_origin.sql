-- Keep club image URLs pinned to GameYer's own Supabase Storage public bucket.
-- Production migration version: 20260815080224.

alter table public.club_images
  drop constraint if exists club_images_gameyer_storage_url_check;

alter table public.club_images
  add constraint club_images_gameyer_storage_url_check
  check (
    url like 'https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/%'
  );
