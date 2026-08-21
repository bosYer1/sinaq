alter table public.clubs
  add column if not exists profile_image_url text;

alter table public.clubs
  drop constraint if exists clubs_profile_image_url_length_check;

alter table public.clubs
  add constraint clubs_profile_image_url_length_check
  check (profile_image_url is null or char_length(profile_image_url) <= 2048);
