# Runtime error and 404 reliability contract

GameYer already emits privacy-safe `runtime_error` and `not_found` analytics events from public error boundaries/routes. Third-party analytics receives operational metadata only; stack traces and error messages stay out of PostHog/GA4.

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

## PostHog insight policy

At the time this contract was written, the custom `runtime_error` and `not_found` events had not yet appeared organically in the PostHog event schema. No synthetic production event will be injected merely to populate a chart. Once the first organic event exists, create 24h/7d trend + path-breakdown tiles on the Founder Analytics dashboard using the same public/test exclusions.

This is intentional data-quality behavior: zero observed events is not replaced with fabricated traffic.
