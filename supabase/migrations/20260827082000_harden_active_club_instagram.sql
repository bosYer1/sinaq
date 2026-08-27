-- Active clubs must have a current, structurally valid Instagram profile URL.
-- Inactive records may remain in the database without Instagram so uncertain
-- club data can be preserved without becoming public.

alter table public.clubs
  drop constraint if exists chk_clubs_instagram_url;

alter table public.clubs
  add constraint chk_clubs_instagram_url
  check (
    instagram_url is null
    or instagram_url ~* '^https://(www\.)?instagram\.com/[a-z0-9._]{1,30}/?(\?.*)?$'
  );

alter table public.clubs
  add constraint chk_active_clubs_require_instagram
  check (not is_active or instagram_url is not null);
