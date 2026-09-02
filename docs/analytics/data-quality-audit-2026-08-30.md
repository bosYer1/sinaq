# GameYer analytics data-quality audit — 2026-08-30

This audit compares the two active production traffic sources without treating pageviews as people. Values are point-in-time and will naturally move as new traffic arrives.

## Last 24 hours at audit time

### Supabase first-party page views

- Pageviews: **88**
- Visits (`visit_id`): **47**
- Persistent anonymous browser visitors (`session_id` field in the legacy table): **40**
- Referrer pageviews: direct **57**, Instagram (`instagram.com` + `l.instagram.com`) **21**, Google **5**, LinkedIn **2**, Facebook Events Manager **2**, Vercel **1**.

Admin/API paths were excluded from this read-only comparison.

### PostHog clean public scope

The reusable `GameYer — Public Pageview` action requires `gameyer.az`, excludes `/admin`, `/api`, non-Regular virtual traffic and the exact known Cloud Browser test distinct ID.

- Clean public pageviews: **42**
- Unique users: **16**
- Unique sessions: **17**
- Referrer pageviews: `$direct` **35**, Instagram **4**, internal `gameyer.az` referrer **3**.

## Why the totals differ

The numbers are **not expected to match one-to-one**:

1. PostHog was activated on 30 August in the evening and does not backfill earlier Supabase traffic.
2. Supabase records the application's first-party visit endpoint; PostHog uses its own browser/session identity and ingestion lifecycle.
3. The PostHog clean action deliberately excludes the known browser-test visitor and virtual bot/AI/automation classifications.
4. Referrer attribution differs: first-party entry-referrer persistence and PostHog `$referring_domain` are not identical concepts. PostHog may also expose same-site navigation as `gameyer.az` while Supabase persists the visit entry source.
5. Browser blockers, privacy tooling, network interruption and script loading can affect third-party analytics without preventing the first-party endpoint from recording a visit.

## Founder reporting rule

- Never present pageviews as users.
- For growth direction, prioritize clean PostHog unique users/sessions plus first-party visits/visitors and Google organic source movement.
- Compare the systems as independent measurement layers; a large divergence is a tracking/data-quality signal, not evidence that either raw total equals real people.
- Historical intervals before PostHog activation must use Supabase/other historical analytics rather than assuming PostHog backfill.
