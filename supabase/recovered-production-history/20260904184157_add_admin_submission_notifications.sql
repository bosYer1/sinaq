create schema if not exists private;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  submission_id uuid references public.club_submissions(id) on delete cascade,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint admin_notifications_submission_type_key unique (type, submission_id)
);

alter table public.admin_notifications enable row level security;

revoke all on table public.admin_notifications from anon;
grant select, update on table public.admin_notifications to authenticated;

create policy admin_read_notifications
on public.admin_notifications
for select
to authenticated
using (public.is_admin());

create policy admin_update_notifications
on public.admin_notifications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function private.create_submission_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status not in ('resolved', 'rejected') then
    insert into public.admin_notifications (
      type,
      submission_id,
      title,
      message,
      metadata
    ) values (
      'club_submission',
      new.id,
      'Yeni klub müraciəti',
      new.club_name || ' üçün yeni müraciət gəlib.',
      jsonb_build_object(
        'club_name', new.club_name,
        'contact_type', new.contact_type,
        'contact_value', new.contact_value,
        'status', new.status,
        'created_at', new.created_at
      )
    )
    on conflict (type, submission_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.create_submission_notification() from public, anon, authenticated;

drop trigger if exists trg_club_submission_notification on public.club_submissions;
create trigger trg_club_submission_notification
after insert on public.club_submissions
for each row
execute function private.create_submission_notification();

create or replace function private.resolve_submission_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status in ('resolved', 'rejected') and old.status is distinct from new.status then
    update public.admin_notifications
    set read_at = coalesce(read_at, now()),
        metadata = metadata || jsonb_build_object('status', new.status)
    where type = 'club_submission'
      and submission_id = new.id;
  elsif old.status is distinct from new.status then
    update public.admin_notifications
    set metadata = metadata || jsonb_build_object('status', new.status)
    where type = 'club_submission'
      and submission_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.resolve_submission_notification() from public, anon, authenticated;

drop trigger if exists trg_club_submission_notification_status on public.club_submissions;
create trigger trg_club_submission_notification_status
after update of status on public.club_submissions
for each row
execute function private.resolve_submission_notification();

create index if not exists admin_notifications_unread_created_idx
on public.admin_notifications (created_at desc)
where read_at is null;
