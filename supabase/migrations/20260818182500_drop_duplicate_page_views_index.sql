-- Supabase performance advisor reports these two indexes as identical.
-- Keep the original index and remove only the redundant v2 copy.

drop index if exists public.idx_page_views_session_created_at_v2;
