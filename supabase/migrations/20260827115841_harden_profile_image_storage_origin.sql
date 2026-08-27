alter table public.clubs
  add constraint clubs_profile_image_gameyer_storage_check
  check (
    profile_image_url is null
    or profile_image_url like (
      'https://uxcedpbumulpheglhlvs.supabase.co/storage/v1/object/public/club-images/'
      || id::text
      || '/profile/%'
    )
  );
