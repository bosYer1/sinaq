create extension if not exists pg_trgm;
create index if not exists idx_clubs_active_premium_rating on public.clubs (is_active, is_premium desc, rating_avg desc nulls last);
create index if not exists idx_clubs_name_trgm on public.clubs using gin (name gin_trgm_ops);
create index if not exists idx_clubs_address_trgm on public.clubs using gin (address gin_trgm_ops);
create index if not exists idx_club_pricing_price_from on public.club_pricing (price_from);
