drop policy if exists public_read_club_images on public.club_images;
create policy public_read_club_images on public.club_images for select to anon, authenticated using (
  exists (select 1 from public.clubs c where c.id = club_images.club_id and (c.is_active = true or public.is_admin()))
);

drop policy if exists public_read_club_opening_hours on public.club_opening_hours;
create policy public_read_club_opening_hours on public.club_opening_hours for select to anon, authenticated using (
  exists (select 1 from public.clubs c where c.id = club_opening_hours.club_id and (c.is_active = true or public.is_admin()))
);

drop policy if exists public_read_club_pricing on public.club_pricing;
create policy public_read_club_pricing on public.club_pricing for select to anon, authenticated using (
  exists (select 1 from public.clubs c where c.id = club_pricing.club_id and (c.is_active = true or public.is_admin()))
);

drop policy if exists public_read_club_type_assignments on public.club_type_assignments;
create policy public_read_club_type_assignments on public.club_type_assignments for select to anon, authenticated using (
  exists (select 1 from public.clubs c where c.id = club_type_assignments.club_id and (c.is_active = true or public.is_admin()))
);