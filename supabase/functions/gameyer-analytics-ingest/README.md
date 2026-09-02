# GameYer analytics ingest

Internal service-to-service endpoint for first-party analytics writes.

Security contract:
- requests must carry a Vercel-issued OIDC token from the `gameyer` team/project production runtime;
- issuer, audience and subject are verified cryptographically against Vercel OIDC discovery/JWKS;
- the Edge Function uses Supabase server credentials available only inside the hosted function;
- browser/public PostgREST INSERT access is revoked after production verification;
- no CORS/public browser integration is supported.
