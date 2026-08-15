-- Advisor xəbərdarlıqlarının düzəlişi:
-- 1) is_admin() yalnız authenticated rol üçün lazımdır (anon üçün mənasızdır, RLS
--    policy-lərimizdə anon rolu heç vaxt is_admin() çağırmır) — EXECUTE-u daraldırıq.
revoke execute on function public.is_admin() from anon;

-- 2) Mövcud set_updated_at() trigger funksiyasında search_path təhlükəsizlik
--    tövsiyəsinə uyğun sabitlənir (məntiq/davranış eyni qalır).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;
