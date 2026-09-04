# Analytics OIDC hardening

## Goal
Keep `page_views` and `analytics_events` on a trusted server-only write path so public clients cannot insert analytics rows directly through PostgREST.

## Current production state
Production hardening is complete on the correct Vercel project, `gameyer`.

Verified live state:
- `/api/health` reports `analytics_write=vercel-oidc-edge`.
- Production analytics writes use the Vercel OIDC-backed edge writer.
- Public INSERT policies for `page_views` and `analytics_events` have been removed.
- `anon` and `authenticated` INSERT privileges for those analytics tables have been removed.
- Synthetic writes were verified before and after revocation, then cleaned up.
- The final production integrity monitor passed after the hardening rollout.

The database records the production migration as `20260901035951_server_only_analytics_writes`. The corresponding repository SQL file remains named `20260831183000_server_only_analytics_writes.sql`; do not rename or replay it only to make the timestamps match.

## Required operating contract
Do not restore the former `public-fallback` path during normal operation. Public browsers must continue sending analytics through the application endpoints, while database INSERT authority remains server-only.

If analytics delivery is suspected to be broken:
1. Check `/api/health` and require `analytics_write=vercel-oidc-edge`.
2. Verify the correct Vercel project is `gameyer` before changing any deployment or identity configuration.
3. Run the existing production analytics/integrity regressions against `https://gameyer.az`.
4. Diagnose the trusted writer or OIDC identity path first; do not re-grant public table INSERT access as a shortcut.
5. Any database-policy rollback must be an explicit incident decision with a tested rollback plan, not an automatic fallback.

## Safety boundaries
- Do not change club data, map/provider configuration, DNS, domain, or unrelated environment variables as part of analytics hardening.
- Do not loosen the OIDC identity lock without a production incident reason and a verified replacement identity.
- Do not expose service-role or secret credentials to client code.
- Keep synthetic/browser-test traffic excluded from founder reporting and clean up any verification rows created by controlled tests.

The old Vercel project `gameyerr` is not part of this system and must not be recreated or used.
