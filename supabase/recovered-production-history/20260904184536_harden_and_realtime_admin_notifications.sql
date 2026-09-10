revoke insert, delete, truncate, references, trigger on table public.admin_notifications from authenticated;
grant select, update on table public.admin_notifications to authenticated;

create index if not exists admin_notifications_unread_created_at_idx
  on public.admin_notifications (created_at desc)
  where read_at is null;

alter publication supabase_realtime add table public.admin_notifications;
