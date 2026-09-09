import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20260909122500_add_club_updates.sql', 'utf8');

if (!migration.includes("source_url ~ '^https://'")) {
  throw new Error('club update source_url must stay HTTPS-only');
}

if (!migration.includes("source_type in (\n      'official_instagram',\n      'official_website',\n      'owner_submission',\n      'other'")) {
  throw new Error('club update source_type whitelist changed unexpectedly');
}

console.log('club update source URL regression passed');
