create policy "admin_users_self_read" on public.admin_users for select to authenticated using (auth.uid() = user_id);

create index if not exists idx_club_pricing_club_type_id on public.club_pricing (club_type_id);