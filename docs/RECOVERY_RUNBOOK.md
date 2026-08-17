# GameYer database recovery runbook

## Scope

This runbook covers recovery of the Supabase PostgreSQL data that powers GameYer. Production project ref: `uxcedpbumulpheglhlvs`.

The application currently depends on these public tables:

- `admin_users`
- `analytics_events`
- `club_images`
- `club_opening_hours`
- `club_pricing`
- `club_submissions`
- `club_type_assignments`
- `club_types`
- `clubs`
- `districts`
- `page_views`

Schema changes are migration-driven and must remain reproducible from the repository/Supabase migration history.

## Recovery objectives

Until measured from a real drill, do not claim a guaranteed RPO or RTO. Record the actual data-loss window and elapsed recovery time after each drill.

For a public beta, the minimum acceptable recovery capability is:

1. A current off-site logical backup exists if managed backups are unavailable.
2. The schema can be reconstructed from migrations.
3. Data can be restored into a non-production target first.
4. Post-restore integrity, RLS and application health checks pass before traffic is pointed at the restored database.

## Backup paths

### Managed Supabase backup

If the project plan exposes managed backups, use the Supabase Dashboard `Database > Backups` flow. A production restore causes downtime and must never be started as a routine test.

### Logical backup

If managed backups are unavailable, create an encrypted off-site logical export with the Supabase CLI. Keep credentials out of shell history and never commit generated SQL/data files to this repository.

Recommended export set:

```bash
supabase db dump --db-url "$GAMEYER_DATABASE_URL" -f roles.sql --role-only
supabase db dump --db-url "$GAMEYER_DATABASE_URL" -f schema.sql
supabase db dump --db-url "$GAMEYER_DATABASE_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Store the three files in encrypted storage outside GitHub. Record timestamp, source project ref, migration head, and checksums.

## Restore drill

Do not run a recovery drill against production.

1. Create a disposable non-production Supabase project/restore target.
2. Restore roles/schema/data using the current Supabase documented restore procedure.
3. Apply any repository migrations newer than the backup timestamp.
4. Run `scripts/recovery-verify.sql` against the restored database.
5. Start GameYer against the restored target with temporary environment variables.
6. Run CI smoke, Responsive and Site Integrity checks.
7. Confirm `/api/health` reports `database: ok`.
8. Confirm representative club detail, district, PC and PlayStation pages load correctly.
9. Record elapsed restore time, failures, manual steps and the backup timestamp.
10. Destroy the disposable target after the drill.

## Production restore decision

A production restore is destructive/availability-impacting. Before starting it:

- identify the incident and desired restore point;
- capture the current database state if possible;
- estimate the data-loss window;
- announce maintenance/downtime;
- verify the selected backup predates the corruption;
- have the current Vercel environment configuration available;
- do not change DNS or production environment variables until post-restore checks pass.

## Post-restore acceptance

A restored database is not considered healthy until all of the following are true:

- required public tables exist;
- active club slugs are unique;
- active clubs have names, slugs and coordinates;
- foreign-key integrity checks succeed;
- RLS is enabled on application tables that require it;
- the current migration head is present;
- application health returns HTTP 200 with `database: ok`;
- public sitemap/routes pass the Site Integrity gate;
- mobile and desktop Responsive gates pass;
- admin access still requires AAL2/MFA.

## Storage caveat

Database backups protect PostgreSQL data and Storage metadata, not necessarily the underlying Storage objects themselves. Club images therefore need a separate storage-object recovery strategy before GameYer relies heavily on uploaded media.

## Drill log

After each drill append:

- date/time (UTC)
- backup timestamp
- restore target
- migration head
- RPO observed
- RTO observed
- verification result
- issues discovered
- corrective actions
