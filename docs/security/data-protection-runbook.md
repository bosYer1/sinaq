# GameYer — Data Protection & Evidence Runbook

Status: repository-only operational runbook. This document does not authorize production changes.

## Objective

Protect GameYer's curated club inventory against low-cost bulk extraction and preserve a defensible evidence trail if a third party later reproduces a substantial part of the dataset.

## 1. Technical boundary

Public users must receive club data through GameYer-rendered pages. The browser publishable Supabase key must not provide bulk SELECT access to the public club inventory tables.

Protected inventory tables in the prepared migration:

- `clubs`
- `club_pricing`
- `club_opening_hours`
- `club_images`
- `club_type_assignments`
- `club_types`
- `districts`
- `club_updates`

Production application code must use `createServerDataClient()` with `SUPABASE_SECRET_KEY` (or legacy service-role fallback) for server-rendered public inventory.

The application code and the database migration are one atomic release unit. Never apply the database migration before the application code is ready.

## 2. Evidence to preserve for every club

Do not fabricate evidence. Preserve only real source material and verification work.

Where available, keep:

- club name and slug
- source URL
- source type
- field being verified
- observed value
- verification/check timestamp
- current/stale state
- who performed the verification when available
- original public source screenshot or archived reference when lawfully retained
- created_at / updated_at history
- owner correction / owner claim records
- Git history for product-side transformations and data rules

`club_data_evidence` remains the canonical structured provenance layer.

## 3. Investment evidence

For database-right claims, preserve evidence of the resources used to prepare, verify and maintain the collection. Keep contemporaneous records of:

- research hours / Hunter or manual verification work
- number of clubs reviewed and rejected
- duplicate-removal work
- location verification
- pricing and hours verification
- owner outreach and corrections
- engineering work that structures, validates and maintains the dataset
- paid tools or services used for data verification, when applicable

Do not inflate these records. Their value comes from being contemporaneous and auditable.

## 4. Suspected copying incident procedure

If a competitor appears to reproduce GameYer inventory:

1. Do not contact them immediately.
2. Record the exact date/time in Asia/Baku.
3. Preserve the competitor URL and the relevant pages.
4. Capture screenshots and, where lawful, an HTML/PDF copy.
5. Record a structured comparison: same club, same ordering/classification, same uncommon wording, same unusual verified data, same timestamps/errors if any.
6. Compare against GameYer's earlier database timestamps and evidence records.
7. Quantify overlap by total clubs and by fields, not anecdotes.
8. Preserve Vercel/Supabase security logs that show suspicious automated access where available.
9. Do not alter GameYer data merely to manufacture evidence.
10. Before sending a legal threat, have Azerbaijan IP counsel review the evidence and the proposed claim.

Public facts such as a club's name, address or phone can exist independently. The strongest evidence is systematic reproduction of the curated collection, its structure/verification work, or repeated extraction that reconstructs a substantial part of it.

## 5. Legal notice

The public `/istifade-qaydalari` page must remain linked from both desktop and mobile navigation.

It must continue to prohibit, without prior written permission:

- automated bulk extraction
- substantial dataset copying/reuse
- repeated systematic extraction that reconstructs the collection
- competitive commercial reuse of the collection
- bypassing technical safeguards

It must not claim ownership of third-party trademarks, logos, photographs or underlying public facts.

## 6. Official registration follow-up

After the Founder has the appropriate tax/legal registration details, review official registration of the GameYer information collection with the Azerbaijan Intellectual Property Agency. Keep the issued certificate and submitted deposit/materials with the project legal records.

Registration is an evidence-strengthening step, not a substitute for proving the facts of a particular infringement.

## 7. Vercel Firewall rollout — no production enforcement without review

Firewall controls can accidentally block real users and search crawlers, so use staged rollout:

1. Add a high-volume scraping rule in LOG mode only.
2. Observe real production matches.
3. Confirm legitimate users and verified search crawlers are not being caught.
4. Test enforcement in preview.
5. Only after Founder approval, publish the production enforcement rule.
6. Prefer rate-based/path-based signals over broad user-agent substring blocking.

Do not block Googlebot/Bingbot or legitimate SEO crawling with generic `bot`, `crawler`, `headless`, `curl` or similar substring rules.

## 8. Release checklist for PR #560

Before release:

- CI green
- Security green
- CodeQL green
- Responsive green
- production has a server-only Supabase secret available
- application code and DB migration are reviewed as one unit
- public homepage, search, map, club detail, sitemap, health, submission form and admin smoke tests pass
- direct browser/publishable-key SELECT against protected inventory is verified to fail after migration
- authenticated admin access is verified to remain functional
- no production mutation before explicit Founder deploy approval
