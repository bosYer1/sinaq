-- Postgres funksiya yaradılanda default olaraq PUBLIC-ə EXECUTE verir —
-- bunu ləğv edib yalnız authenticated (və service_role/postgres) üçün saxlayırıq.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
