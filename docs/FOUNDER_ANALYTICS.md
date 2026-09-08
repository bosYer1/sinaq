# Founder Analytics / Admin Command Center

`/admin/analitika` admin + MFA sərhədinin arxasında işləyir. Panel Meta Ads, PostHog, GA4, Google Search Console və Supabase-dən read-only data oxuyur; production datasına və reklam hesabına yazmır.

## Server environment

- `POSTHOG_PERSONAL_API_KEY`: yalnız server üçün read-capable PostHog personal API key
- `POSTHOG_PROJECT_ID`: PostHog project ID
- `POSTHOG_API_HOST`: `https://us.posthog.com` və ya `https://eu.posthog.com`
- `META_ACCESS_TOKEN`: yalnız server üçün Meta Marketing API token; Insights read access tələb edir
- `META_AD_ACCOUNT_ID`: Meta ad account ID; `act_` prefiksi qəbul olunur, server daxilində normalize edilir
- `GA4_PROPERTY_ID`, `GOOGLE_ANALYTICS_CLIENT_EMAIL`, `GOOGLE_ANALYTICS_PRIVATE_KEY`: GA4 Data API read-only adapteri
- `GSC_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`, `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`: Search Console read-only adapteri

Private dəyişənlərin heç biri `NEXT_PUBLIC_` prefiksi daşımamalıdır.

## Data contracts

- Meta Ads: Marketing API v26.0 Ads Insights; spend, impressions, reach, clicks, CTR, CPC, CPM və campaign-level breakdown. Token yalnız server-side `Authorization: Bearer` headerində göndərilir. Saat əsaslı dashboard intervalı Meta-nın calendar-date granularity məhdudiyyətinə görə həmin intervalın toxunduğu Bakı tarixlərinə çevrilir.
- Meta → onsite attribution: Meta `campaign_id` və ya `campaign_name` yalnız `paid_social` PostHog `utm_campaign` ilə uyğun gələndə onsite sessions, club views və CTA intent ilə birləşdirilir. Uyğunluq yoxdursa `—` göstərilir; attribution uydurulmur.
- PostHog: yalnız `gameyer_traffic_scope = public`; pageview, club view/card click, search/filter və phone/Instagram/maps CTA eventləri.
- Campaign: first-touch UTM, yaxud Facebook click ID; məlumat yoxdursa `(kampaniyasız)` kimi göstərilir, attribution uydurulmur.
- GA4: sessions, active/total/new users, pageviews, engagement/bounce, average session duration, events və key events.
- GSC: clicks, impressions, CTR, average position, top queries və top pages.
- Supabase: aktiv/verified klub sayı, açıq müraciətlər və profil sahələrinin tamlığı; mövcud admin RLS ilə oxunur.
- CEO Signals: versiyalanmış kod qaydaları ilə deterministik çıxarılır; AI-generated və ya saxta tövsiyə deyil.

External provider sorğuları beş dəqiqə bounded cache olunur. Provider konfiqurasiyası yoxdursa və ya API xətası baş verirsə həmin provider fail closed olur, rəqəm uydurulmur və digər provider-lər işləməyə davam edir.
