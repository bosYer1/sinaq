# GameYer September KPI Contract

Status: measurement contract, no production behavior change.

## Goal
Use one stable definition for every growth, marketplace, B2B and monetization metric through September so week-over-week comparisons remain valid.

## Acquisition
- Sessions: unique PostHog sessions in public traffic scope.
- New visitors: first-seen visitors in the measured period.
- Returning visitors: visitors whose first-seen timestamp predates the measured period.
- Google organic sessions: sessions whose acquisition/referrer source is Google and not tagged as paid.
- Paid social sessions: sessions with paid-social UTM medium or approved paid campaign tags.
- Direct/unknown: sessions with no reliable external acquisition source.

## Discovery
- Search sessions: unique sessions containing `search_query`.
- Unique search terms: normalized distinct search values.
- Zero-result searches: search events where result_count = 0 once result-count instrumentation is live.
- Filter-use sessions: unique sessions with district/type/price filter events.
- Map-use sessions: unique sessions that activate/select map view or map interaction events.

## Club marketplace
- Club impressions: visible `club_impression` events, counted only when the card satisfies the defined visibility threshold.
- Unique impression sessions: unique sessions with at least one impression for a club.
- Club profile clicks: `club_card_click`.
- Club CTR: unique club-click sessions / unique club-impression sessions for the same club and placement context.
- Club pageviews: public `/klub/<slug>` pageviews.

## Lead / outbound actions
- Phone leads: unique sessions with `phone_click`.
- Instagram leads: unique sessions with `instagram_click`.
- Maps leads: unique sessions with `maps_click`.
- Total outbound lead sessions: unique sessions with at least one of the three outbound action types. Do not sum raw unique counts across event types because one session can perform multiple actions.
- Club lead rate: unique outbound lead sessions / unique club profile-view sessions.

## B2B funnel
For each submission kind (`new_club`, `owner_claim`, `correction`):
- form views = `submission_form_viewed`
- starts = `submission_form_started`
- submit attempts = `submission_submit_attempt`
- successful submits = `submission_result` with result `sent`
- blocked/rate outcomes = `submission_result` with result `rate_limited`
- error outcomes = `submission_result` with result `error`
- form start rate = starts / views
- submit conversion = successful submits / starts

Database status remains the operational source for pending/reviewing/resolved/rejected submissions; PostHog measures user funnel behavior, not admin truth.

## Performance
Use real-user p75 unless explicitly noted:
- LCP
- INP
- CLS

Always show sample count beside low-volume performance comparisons. Do not claim improvement from tiny samples without qualification.

## Monetization
Once commercial tables are live:
- Contracted revenue: sum of agreed net contract amounts in valid commercial states.
- Collected revenue: paid payment rows net of explicit refunds.
- Outstanding revenue: collectible contract amount minus collected amount, according to contract/payment status rules.
- Active paying customers: customers with at least one active paid commercial relationship.
- Active paid clubs: clubs with at least one active commercial placement/contract.
- Placement impressions/clicks/leads: aggregate PostHog events joined by stable `placement_id`/`club_id`.
- Placement CTR: unique click sessions / unique impression sessions.
- Placement lead rate: unique outbound lead sessions / unique profile-click sessions.

## Reporting rules
1. PostHog is the primary behavioral source for public traffic and funnels.
2. PostgreSQL is the source of truth for club records, submissions and future commercial ledger.
3. GA4 is a secondary acquisition/cross-check source, not a replacement for the internal KPI definitions.
4. Test/smoke/admin/API traffic must be excluded.
5. Date comparisons must use the same timezone boundary and equal-duration windows.
6. Never add percentages with different denominators.
7. Never infer revenue or leads from pageviews alone.
8. If instrumentation changed during a comparison window, mark the metric as partial rather than pretending the time series is complete.
