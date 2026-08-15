alter table public.clubs
  add constraint chk_clubs_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint chk_clubs_instagram_url check (instagram_url is null or instagram_url ~* '^https://(www\.)?instagram\.com/');

alter table public.districts
  add constraint chk_districts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.club_types
  add constraint chk_club_types_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');