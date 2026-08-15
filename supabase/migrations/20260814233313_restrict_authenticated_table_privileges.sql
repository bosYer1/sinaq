revoke insert, update, delete, truncate, references, trigger on table public.admin_users from authenticated;
grant select on table public.admin_users to authenticated;

revoke truncate, references, trigger on table
  public.clubs,
  public.districts,
  public.club_types,
  public.club_type_assignments,
  public.club_pricing,
  public.club_opening_hours,
  public.club_images
from authenticated;