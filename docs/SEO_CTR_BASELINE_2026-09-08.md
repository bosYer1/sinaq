# SEO CTR baseline — 2026-09-08

Source: live Google Search Console settled 28-day window through 2026-09-05 plus live on-page audit.

## Why this change exists

Several indexable GameYer pages rank on page one but receive zero clicks. The live on-page audit found a consistent mechanical issue: titles and meta descriptions are longer than common search-snippet display ranges.

Priority examples before this PR:
- OMG Cyber Zone — 109 impressions, 0 clicks; title 89 chars; meta description 201 chars.
- LaLiga Lounge - Əhmədli — 95 impressions, 0 clicks; title 89 chars; meta 204 chars.
- Nərimanov district — 65 impressions, 0 clicks; title 68 chars; meta 174 chars.
- ForGamer Yasamal — 47 impressions, 0 clicks; title 77 chars; meta 191 chars.
- The best gaming arena — 42 impressions, 0 clicks; title 81 chars; meta 188 chars.
- Milli Gaming Arena — 39 impressions, 0 clicks; title 96 chars; meta 202 chars.
- COLIZEUM Baku — 36 impressions, 0 clicks; title 72 chars; meta 186 chars.
- LaLiga Game Center Nerimanov — 36 impressions, 0 clicks; title 89 chars; meta 213 chars.

## Change

Club metadata now prioritizes `club name → district → price/category` and removes the long `qiymətlər ... və ünvan` suffix. Meta descriptions keep factual location/category/price plus a compact GameYer CTA instead of repeating full address/phone/map sentences.

District metadata is shortened to intent-first wording while preserving real club counts and real price floors.

For branch disambiguation, the structured breadcrumb leaf uses the existing verified district name (`club — district`) while every distinct branch remains self-canonical. No parent-brand entity, redirect, canonical consolidation, or fabricated branch relationship is introduced.

## Measurement

Re-check the same pages after Google has re-crawled them. Primary metric: organic CTR at similar average positions. Secondary: query/page impression distribution for branded multi-branch searches.

Rollback: revert this PR; no schema, RLS, production data, DNS, or provider changes are involved.
