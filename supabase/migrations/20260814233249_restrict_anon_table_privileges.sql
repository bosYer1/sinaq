revoke all privileges on table public.admin_users from anon;

revoke insert, update, delete, truncate, references, trigger on table
  public.clubs,
  public.districts,
  public.club_types,
  public.club_type_assignments,
  public.club_pricing,
  public.club_opening_hours,
  public.club_images
from anon;

grant select on table
  public.clubs,
  public.districts,
  public.club_types,
  public.club_type_assignments,
  public.club_pricing,
  public.club_opening_hours,
  public.club_images
to anon;