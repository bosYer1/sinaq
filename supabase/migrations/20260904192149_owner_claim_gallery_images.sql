alter table public.club_submissions
  add column if not exists submitted_images text[] not null default '{}'::text[];

alter table public.club_submissions
  drop constraint if exists club_submissions_submitted_images_max_5;

alter table public.club_submissions
  add constraint club_submissions_submitted_images_max_5
  check (cardinality(submitted_images) <= 5);

create or replace function public.verify_owner_claim_atomic(p_submission_id uuid)
returns uuid
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_club_id uuid;
  v_status text;
  v_images text[];
  v_existing_count integer;
  v_max_position integer;
  v_has_cover boolean;
  v_image_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select club_id, status, submitted_images
  into v_club_id, v_status, v_images
  from public.club_submissions
  where id = p_submission_id
    and kind = 'owner_claim'
  for update;

  if v_club_id is null then
    raise exception 'Owner claim or linked club not found';
  end if;

  if v_status in ('resolved', 'rejected') then
    raise exception 'Completed owner claim cannot be verified';
  end if;

  v_image_count := coalesce(cardinality(v_images), 0);

  if v_image_count > 5 then
    raise exception 'Owner claim can contain at most 5 images';
  end if;

  if exists (
    select 1
    from unnest(coalesce(v_images, '{}'::text[])) as image_url
    where image_url !~ ('^https://uxcedpbumulpheglhlvs\.supabase\.co/storage/v1/object/public/club-images/owner-submissions/' || p_submission_id::text || '/[A-Za-z0-9._-]+$')
  ) then
    raise exception 'Invalid owner claim image URL';
  end if;

  select count(*), coalesce(max(position), -1), coalesce(bool_or(is_cover), false)
  into v_existing_count, v_max_position, v_has_cover
  from public.club_images
  where club_id = v_club_id;

  if v_existing_count + v_image_count > 8 then
    raise exception 'Club image limit would be exceeded';
  end if;

  if v_image_count > 0 then
    insert into public.club_images (club_id, url, position, is_cover)
    select
      v_club_id,
      image_url,
      v_max_position + ordinality::integer,
      (not v_has_cover and v_existing_count = 0 and ordinality = 1)
    from unnest(v_images) with ordinality as submitted(image_url, ordinality);
  end if;

  update public.clubs
  set
    is_active = true,
    is_verified = true,
    verified_at = now(),
    updated_at = now()
  where id = v_club_id;

  update public.club_submissions
  set
    status = 'resolved',
    reviewed_at = now(),
    applied_fields = coalesce(applied_fields, '{}'::jsonb) || jsonb_build_object('owner_gallery_images', v_image_count),
    applied_at = case when v_image_count > 0 then coalesce(applied_at, now()) else applied_at end
  where id = p_submission_id;

  return v_club_id;
end;
$function$;

revoke all on function public.verify_owner_claim_atomic(uuid) from public, anon;
grant execute on function public.verify_owner_claim_atomic(uuid) to authenticated;
