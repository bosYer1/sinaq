# GameYer Return Loop MVP

## Problem
GameYer acquisition is growing, but most measured visitors are still first-time users. A static club directory does not by itself create a strong reason to return.

## Hypothesis
Time-sensitive, verified club updates — tournaments and offers — can create a repeat-use loop without expanding into reservations, payments, marketplace, loyalty, or native-app scope.

## Truth rules
- Never publish invented tournament, discount, date, price, or club information.
- Every update must carry a verifiable HTTPS source.
- Public reads include only active, non-expired items attached to active clubs.
- Admin-only writes remain protected by RLS.
- Expired updates disappear automatically from public reads.

## MVP surfaces
1. `/yenilikler` — lightweight public discovery feed.
2. Club detail module — active updates relevant to that club. (next implementation step)
3. Founder Analytics — return-loop events and downstream club intent. (next implementation step)

## Measurement contract
- `club_update_impression`
- `club_update_club_click`
- `club_update_source_click`
- downstream `club_view`
- downstream CTA events
- first-time vs returning active users

## Release gate
The migration is not applied directly from this branch. Production requires normal CI/security/responsive validation and a reviewed migration release path. No seed data is included.
