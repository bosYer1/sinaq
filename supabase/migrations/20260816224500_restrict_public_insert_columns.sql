-- Defense in depth: public/authenticated clients may only insert into the
-- explicit columns needed by GameYer's public submission and analytics flows.
-- System-owned state/timestamps remain inaccessible even if PostgREST is called
-- directly with the publishable key.

-- club_submissions
revoke insert on table public.club_submissions from anon, authenticated;
grant insert (kind, club_id, club_name, message, contact_type, contact_value)
  on table public.club_submissions to anon, authenticated;

-- page_views
revoke insert on table public.page_views from anon, authenticated;
grant insert (session_id, path, referrer_host)
  on table public.page_views to anon, authenticated;

-- analytics_events
revoke insert on table public.analytics_events from anon, authenticated;
grant insert (session_id, path, event_type, club_slug)
  on table public.analytics_events to anon, authenticated;

-- Keep sequences/system fields database-owned. UUID/default identifiers and
-- created_at values are generated server-side by PostgreSQL defaults.
