-- Keep the generic contact length constraint aligned with the type-specific
-- validation in enforce_club_submission_rate_limit(). Instagram usernames may
-- legitimately be 1-2 characters, while email/phone minimums are enforced by
-- the trigger's format checks.

alter table public.club_submissions
  drop constraint if exists club_submissions_contact_value_check;

alter table public.club_submissions
  add constraint club_submissions_contact_value_check
  check (char_length(contact_value) between 1 and 200);
