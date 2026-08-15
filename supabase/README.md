# GameYer Supabase schema history

`supabase/migrations/` contains the exact SQL recorded in the production Supabase migration history. Historical files that were originally applied through the Supabase tooling but were missing from Git were recovered from `supabase_migrations.schema_migrations.statements` on 15 August 2026.

## Empty-project recovery

The six original GameYer tables were created before migration tracking started. Their pre-migration structure is recorded in `bootstrap/000_core_schema.sql`. On a completely empty Supabase project:

1. Run `bootstrap/000_core_schema.sql` once.
2. Apply every file in `migrations/` in filename order.
3. Seed lookup/business data separately. The bootstrap intentionally contains no production club records or admin user IDs.
4. Create the intended admin Auth user, then add that user's UUID to `public.admin_users` through a trusted administrative channel.

Do **not** run the bootstrap against the existing production database. It is a disaster-recovery/fresh-environment bootstrap, not a production migration.

## Migration manifest

`production-migrations.txt` records the migration versions and names currently registered in production. CI verifies that every manifest entry has a corresponding SQL file and that no migration SQL file exists without a manifest entry. Whenever a new production migration is added, update the manifest in the same change.

The manifest checks repository completeness; the live production migration history should still be compared with Supabase before a release that changes database schema.
