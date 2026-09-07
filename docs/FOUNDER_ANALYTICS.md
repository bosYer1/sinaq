# Founder Analytics / Admin Command Center

`/admin/analitika` admin + MFA sərhədinin arxasında işləyir. V1 real davranış datasını PostHog-dan, klub və müraciət vəziyyətini Supabase-dən oxuyur; production datasına yazmır.

## Server environment

- `POSTHOG_PERSONAL_API_KEY`: yalnız server üçün read-capable PostHog personal API key
- `POSTHOG_PROJECT_ID`: PostHog project ID
- `POSTHOG_API_HOST`: `https://us.posthog.com` və ya `https://eu.posthog.com`

Bu dəyişənlərin heç biri `NEXT_PUBLIC_` prefiksi daşımamalıdır. Meta, GA4 və GSC adapter müqavilələri `.env.example`-da qeyd olunub; V1-də real sorğu implementasiyası olmadığı üçün panel onları açıq `unavailable` göstərir.

## Data contracts

- PostHog: yalnız `gameyer_traffic_scope = public`; pageview, club view/card click, search/filter və phone/Instagram/maps CTA eventləri.
- Campaign: first-touch UTM, yaxud Facebook click ID; məlumat yoxdursa `(kampaniyasız)` kimi göstərilir, attribution uydurulmur.
- Supabase: aktiv/verified klub sayı, açıq müraciətlər və profil sahələrinin tamlığı; mövcud admin RLS ilə oxunur.
- CEO Signals: versiyalanmış kod qaydaları ilə deterministik çıxarılır; AI-generated və ya saxta tövsiyə deyil.

PostHog sorğuları beş dəqiqə cache olunur. Provider xətası digər provider göstəricilərini bloklamır və UI-da açıq statusla göstərilir.
