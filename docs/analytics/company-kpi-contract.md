# GameYer Company KPI Contract — September 2026

Status: measurement contract

## Purpose
Use one stable set of definitions for growth, product and monetization decisions. Metrics must not change meaning between reports.

## Acquisition

### Sessions
Unique PostHog sessions on public GameYer pages. Admin/API/test traffic excluded by the production analytics filter.

### New visitors
Visitors whose first known GameYer touch occurs in the reporting period.

### Returning visitors
Visitors with a known prior GameYer touch before the reporting period.

### First-touch source
Persisted first known acquisition source/referrer/UTM. It must not be overwritten by later direct visits.

### Current-session source
The source/referrer/UTM attached to the current visit.

Always report first-touch and current-session attribution separately when available.

## Discovery

### Search sessions
Unique sessions containing at least one `search_query` event.

### Zero-result searches
Search queries that produce zero matching clubs. This metric identifies missing inventory, aliases and discoverability gaps.

### Filter adoption
Unique sessions using district, type or price filters divided by discovery sessions.

### Map adoption
Unique sessions switching to/activating map discovery divided by discovery sessions.

## Club marketplace funnel

### Club impression
A club card is counted as an impression only when at least 60% of the card is visible in the viewport. Repeated render noise in the same mounted card instance must not inflate the event.

### Club profile click
`club_card_click` from a discovery surface.

### Club CTR
Unique club-card click sessions / unique club-impression sessions for the same club and comparable surface.

Do not compare CTR without accounting for list position and traffic source.

### Club page view
A public `/klub/{slug}` pageview.

### Outbound lead
A user action that can create value for the club:
- `phone_click`
- `instagram_click`
- `maps_click`

### Unique outbound lead sessions
Unique sessions with at least one outbound lead action. Multiple clicks in one session do not equal multiple unique leads.

### Profile-to-lead rate
Unique outbound lead sessions / unique club-page-view sessions.

This is a behavioral lead proxy, not proof of a completed booking or sale at the club.

## B2B supply funnel

Events:
- `submission_form_viewed`
- `submission_form_started`
- `submission_submit_attempt`
- `submission_result`

Break down by submission type:
- `new_club`
- `owner_claim`
- `correction`

### Form start rate
Unique started sessions / unique viewed sessions.

### Submit attempt rate
Unique submit-attempt sessions / unique started sessions.

### Successful submission rate
Unique sessions with `submission_result=result:sent` / unique submit-attempt sessions.

### Operational resolution
Database source of truth from `club_submissions.status` and `reviewed_at`, not PostHog.

## Performance / quality

Use p75 real-user metrics, not averages:
- LCP
- INP
- CLS

Break out mobile homepage separately once sample size is meaningful.

Never label a tiny same-day sample as a stable performance improvement.

## Monetization

Commercial source of truth must be PostgreSQL commercial ledger once implemented.

### Booked revenue
Sum of agreed contract value for qualifying active/completed contracts under the accounting rule chosen by the business. Until that rule is formally selected, do not mix booked revenue with collected cash.

### Collected revenue
Sum of `commercial_payments.amount_azn` where payment status is `paid`.

### Outstanding revenue
Contractually due amount minus collected/refunded-adjusted amount under the final accounting rule.

### Placement impressions
Club impressions attributable to a paid `placement_id`.

### Placement CTR
Unique paid-placement club-card click sessions / unique paid-placement impression sessions.

### Placement lead rate
Unique outbound lead sessions attributable to the placement / unique placement club-page-view sessions.

### Revenue per outbound lead
Collected revenue attributable to a placement / unique outbound lead sessions attributable to that placement.

Use only when attribution is reliable enough; otherwise report revenue and lead volume separately.

## Data quality rules
1. Never invent missing club/business/revenue facts.
2. Exclude admin/API and known analytics smoke/test traffic.
3. Separate unique-session metrics from raw event counts.
4. Never call outbound clicks completed bookings or club revenue.
5. Report sample size for Web Vitals comparisons.
6. Preserve first-touch attribution; do not replace it with latest direct traffic.
7. PostgreSQL is authoritative for submissions, contracts and payments; PostHog is authoritative for behavioral funnels.
8. GA4 is an independent acquisition/traffic cross-check, not a replacement for the internal commercial ledger.
9. Any future ad platform spend must be joined by explicit campaign identifiers; do not infer spend from UTM traffic alone.
10. Metric definition changes require updating this contract and noting the effective date.

## September executive scorecard
At minimum report weekly:
- public sessions
- new vs returning visitors
- Google organic sessions
- paid social sessions by campaign
- top landing pages
- search sessions and zero-result searches
- club impressions
- club-card click sessions and CTR
- club pageviews
- phone / Instagram / Maps unique lead sessions
- B2B submission funnel
- p75 LCP / INP / CLS
- active commercial customers (once ledger exists)
- collected revenue (once ledger exists)
