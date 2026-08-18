-- The analytics endpoint now stores server-observed IP and user-agent metadata.
-- A previous column-level hardening migration only granted INSERT on the original
-- page_views columns, so PostgREST rejected the expanded insert payload.
-- Keep system-owned columns protected while allowing only the fields required by
-- the existing validated/rate-limited analytics endpoint.

revoke insert on table public.page_views from anon, authenticated;

grant insert (session_id, path, referrer_host, ip_address, user_agent)
  on table public.page_views to anon, authenticated;
