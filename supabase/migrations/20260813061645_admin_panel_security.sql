-- ============================================================================
-- BoşYer — Admin Panel üçün təhlükəsizlik qatı
-- 1) admin_users cədvəli (yalnız DB sahibi tərəfindən idarə olunur)
-- 2) is_admin() SECURITY DEFINER funksiyası
-- 3) Bütün mövcud cədvəllərdə RLS aktivləşdirilir + policy-lər əlavə olunur
--    (public üçün əvvəlki davranış saxlanılır, yazma yalnız admin üçündür)
-- ============================================================================

-- 1) Admin allowlist cədvəli
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Qəsdən heç bir policy əlavə olunmur: client (anon/authenticated) bu cədvələ
-- birbaşa daxil ola bilməz. Admin təyinatı yalnız Supabase Dashboard/SQL Editor
-- vasitəsilə (layihə sahibi tərəfindən) edilir.

-- 2) is_admin(): digər policy-lərdə təhlükəsiz istifadə üçün SECURITY DEFINER
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3) RLS-i bütün mövcud cədvəllərdə aktivləşdir
alter table public.districts enable row level security;
alter table public.club_types enable row level security;
alter table public.clubs enable row level security;
alter table public.club_pricing enable row level security;
alter table public.club_opening_hours enable row level security;
alter table public.club_images enable row level security;

-- 4) districts — açıq oxuma, yalnız admin yazma
drop policy if exists "public_read_districts" on public.districts;
create policy "public_read_districts" on public.districts
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_districts" on public.districts;
create policy "admin_write_districts" on public.districts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5) club_types — açıq oxuma, yalnız admin yazma
drop policy if exists "public_read_club_types" on public.club_types;
create policy "public_read_club_types" on public.club_types
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_club_types" on public.club_types;
create policy "admin_write_club_types" on public.club_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6) clubs — public yalnız aktiv klubları görür (mövcud davranış), admin hamısını görür/idarə edir
drop policy if exists "public_read_active_clubs" on public.clubs;
create policy "public_read_active_clubs" on public.clubs
  for select to anon, authenticated using (is_active = true);

drop policy if exists "admin_write_clubs" on public.clubs;
create policy "admin_write_clubs" on public.clubs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 7) club_pricing — açıq oxuma (mövcud davranış), yalnız admin yazma
drop policy if exists "public_read_club_pricing" on public.club_pricing;
create policy "public_read_club_pricing" on public.club_pricing
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_club_pricing" on public.club_pricing;
create policy "admin_write_club_pricing" on public.club_pricing
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8) club_images — açıq oxuma (mövcud davranış), yalnız admin yazma
drop policy if exists "public_read_club_images" on public.club_images;
create policy "public_read_club_images" on public.club_images
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_club_images" on public.club_images;
create policy "admin_write_club_images" on public.club_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 9) club_opening_hours — açıq oxuma (mövcud davranış), yalnız admin yazma
drop policy if exists "public_read_club_opening_hours" on public.club_opening_hours;
create policy "public_read_club_opening_hours" on public.club_opening_hours
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_club_opening_hours" on public.club_opening_hours;
create policy "admin_write_club_opening_hours" on public.club_opening_hours
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
