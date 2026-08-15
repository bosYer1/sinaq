alter table public.club_pricing
  add constraint chk_club_pricing_positive check (price_from > 0),
  add constraint chk_club_pricing_range check (price_to is null or price_to >= price_from);

alter table public.clubs
  add constraint chk_clubs_rating_avg check (rating_avg is null or (rating_avg >= 0 and rating_avg <= 5)),
  add constraint chk_clubs_rating_count check (rating_count >= 0),
  add constraint chk_clubs_latitude check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add constraint chk_clubs_longitude check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.club_images
  add constraint chk_club_images_position check (position >= 0);

alter table public.club_opening_hours
  add constraint chk_opening_hours_consistency check (
    (is_closed = true and open_time is null and close_time is null)
    or
    (is_closed = false and open_time is not null and close_time is not null)
  );