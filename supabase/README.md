# GameYer Supabase schema history

`supabase/migrations/` is the active repository migration/replay set. Historical migrations were recovered from production over time, so a repository filename timestamp is **not always the same timestamp** that Supabase registered in `supabase_migrations.schema_migrations`.

For production provenance use these files together:

- `production-migrations.txt` — exact inventory of SQL files currently present in `supabase/migrations/`; CI keeps this equal to the active repository migration set.
- `production-history.txt` — read-only snapshot of the exact `version_name` identifiers registered in live Supabase migration history, captured on 10 September 2026.
- `recovered-production-history/` — audit-only SQL recovered from live history for production entries that have no corresponding active repository migration name. **Do not auto-apply this directory.**
- `repository-only-migrations.txt` — active repository migrations whose names are intentionally absent from Supabase's tracked live migration history.

`migration-history-regression.mjs` verifies that every live-history migration is represented either by an active migration with the same semantic name or by an exact-version recovered-history file, and that every repository-only exception is explicit. Timestamp aliases are allowed and reported instead of being silently mistaken for missing migrations.

## Empty-project recovery

The six original GameYer tables were created before migration tracking started. Their pre-migration structure is recorded in `bootstrap/000_core_schema.sql`. On a completely empty Supabase project:

1. Run `bootstrap/000_core_schema.sql` once.
2. Treat `production-history.txt` as the production provenance/order reference and resolve tracked entries by migration name to the active repository SQL.
3. Review `repository-only-migrations.txt` separately before applying any repository-only operational/data migration.
4. Never replay `recovered-production-history/` blindly; it exists for audit/provenance and may contain historical data operations that are inappropriate for a current restore.
5. Seed current lookup/business data from an approved backup/export rather than assuming historical data migrations represent current truth.
6. Create the intended admin Auth user, then add that user's UUID to `public.admin_users` through a trusted administrative channel.

For an actual production disaster recovery, prefer the current database backup/restore procedure over reconstructing production by replaying historical data migrations.

Do **not** run the bootstrap against the existing production database. It is a disaster-recovery/fresh-environment bootstrap, not a production migration.

## Release discipline

Before a release that changes database schema, compare live `supabase_migrations.schema_migrations` against `production-history.txt`. If a live migration is created with a different Supabase-generated timestamp, update the production-history snapshot and verify the SQL/intent relationship; do not rewrite live migration history merely to make timestamps match the repository.
