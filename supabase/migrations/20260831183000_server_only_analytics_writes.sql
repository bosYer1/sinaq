-- Remove direct public PostgREST writes after the web routes have moved to a
-- server-only Supabase secret/service-role client. The service_role retains its
-- existing table privileges and bypasses RLS; admin read/delete policies stay intact.

DROP POLICY IF EXISTS anon_insert_page_views ON public.page_views;
DROP POLICY IF EXISTS authenticated_insert_page_views ON public.page_views;
DROP POLICY IF EXISTS anon_insert_analytics_events ON public.analytics_events;
DROP POLICY IF EXISTS authenticated_insert_analytics_events ON public.analytics_events;

REVOKE INSERT (session_id, visit_id, path, referrer_host, user_agent)
  ON TABLE public.page_views FROM anon, authenticated;

REVOKE INSERT (session_id, path, event_type, club_slug)
  ON TABLE public.analytics_events FROM anon, authenticated;
