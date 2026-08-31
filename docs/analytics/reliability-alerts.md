# Runtime error and 404 reliability contract

GameYer emits privacy-safe `runtime_error` and `not_found` analytics events from public error boundaries/routes. Third-party analytics receives operational metadata only; stack traces and error messages stay out of PostHog/GA4.

## Event contract

### `runtime_error`

Allowed properties:
- `path`
- `digest_present` boolean

Do not send stack, message, phone, email, coordinates or user-entered text.

### `not_found`

Allowed property:
- `path`

Admin/API routes are excluded.

## Alert-ready thresholds

Until enough baseline volume exists, use conservative review thresholds rather than claiming statistical anomaly detection:

- `runtime_error`: any organic occurrence should trigger engineering review; 3+ occurrences on one path in 60 minutes is high priority.
- `not_found`: 5+ hits on one path in 60 minutes, or a sharp repeated path cluster, should trigger broken-link/redirect review.
- Production monitor failure (`/api/health`, sitemap integrity, public form availability or 404 contract) is P0 operational review.

No paid alerting service is required or enabled by this contract.

## PostHog insight policy

Zero-state 7-day trend insights for `runtime_error` and `not_found` are already attached to the Founder Analytics dashboard. They are allowed to remain empty; synthetic production events must never be injected merely to populate a chart.

At the latest schema verification, neither custom event had occurred organically in the previous 30 days. Therefore event-property combinations such as path breakdowns are not treated as empirically verified PostHog data yet, even though the application-side event contract restricts them to the properties above.

When the first organic event appears:
1. verify the event and its `path` property through the PostHog data schema;
2. add 24-hour and 7-day path-breakdown views using the same public/test exclusions;
3. compare counts against the thresholds above before escalating.

This is intentional data-quality behavior: zero observed events is never replaced with fabricated traffic, and an empty reliability chart is a valid healthy state rather than missing telemetry evidence.
