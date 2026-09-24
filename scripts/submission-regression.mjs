import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [actionSource, formSource, contactSource, clubListSource] = await Promise.all([
  readFile(new URL('../src/app/submissions/actions.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/submissions/SubmissionForm.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/elaqe/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/clubs/ClubList.tsx', import.meta.url), 'utf8'),
]);

assert.match(actionSource, /const KINDS = new Set\(\['correction', 'new_club', 'owner_claim'\]\)/, 'all public submission kinds must remain accepted');
assert.match(actionSource, /supabase\.from\('club_submissions'\)\.insert\(/, 'submissions must still insert through Supabase');
assert.doesNotMatch(actionSource, /status\s*:/, 'public submission insert must not write database-owned status');
assert.doesNotMatch(actionSource, /reviewed_at\s*:/, 'public submission insert must not write reviewed_at');
assert.match(actionSource, /Submission rate limit exceeded/, 'rate-limit handling must remain wired');
assert.match(actionSource, /redirect\(successUrl\)/, 'successful submissions must redirect to sent state');
assert.match(actionSource, /resultUrl\(formData, 'error'\)/, 'invalid or failed submissions must redirect to error state');
assert.match(actionSource, /resultUrl\(formData, 'rate'\)/, 'rate-limited submissions must redirect to rate state');

assert.match(formSource, /action=\{submitClubSubmission\}/, 'public form must remain connected to the server action');
assert.match(formSource, /name="website"/, 'honeypot field must remain present');
assert.match(formSource, /name="contact_value"[\s\S]*required/, 'contact value must remain required');
assert.match(formSource, /const simpleContact = !ownerClaim/, 'new-club and correction forms must use the simplified contact flow');
assert.match(formSource, /name="contact_type" value="phone"/, 'simplified submissions must submit phone as the fixed contact type');
assert.match(formSource, /type="tel"[\s\S]*placeholder="\+994 50 123 45 67"/, 'simplified submissions must expose a phone-number input');
assert.match(actionSource, /SADƏLƏŞDİRİLMİŞ YENİ KLUB TƏKLİFİ/, 'new-club submissions must synthesize an internal message without asking users for one');
assert.match(actionSource, /SADƏLƏŞDİRİLMİŞ DÜZƏLİŞ MÜRACİƏTİ/, 'correction submissions must synthesize an internal message without asking users for one');
assert.match(formSource, /name="official_tiktok"/, 'owner claim form must accept first-class TikTok evidence.');
assert.match(actionSource, /function validTikTok\(value: string\)/, 'owner claim action must validate TikTok evidence before storing it in the structured message.');
assert.match(actionSource, /Rəsmi TikTok:/, 'owner claim structured evidence must preserve the official TikTok source.');
assert.match(contactSource, /kind="new_club"/, 'contact page must continue exposing new club submissions');
assert.match(contactSource, /suggest\?: string/, 'contact page must accept a missing-club suggestion query for prefill.');
assert.match(contactSource, /clubName=\{suggestedClub\}/, 'new-club form must prefill the search suggestion without changing the correction form.');
assert.match(contactSource, /Klubun adını və əlaqə nömrənizi yazın\./, 'contact page must explain the simplified two-field flow');
assert.match(contactSource, /params\.sent === '1'/, 'contact page must render success feedback');
assert.match(contactSource, /params\.error === '1'/, 'contact page must render failure feedback');
assert.match(contactSource, /section id="new-club"/, 'contact page must expose a stable new-club anchor.');
assert.match(clubListSource, /\/elaqe\?suggest=\$\{encodeURIComponent\(searchQuery\)\}#new-club/, 'search no-result state must carry the query only as an encoded suggestion prefill.');
assert.match(clubListSource, /Klub siyahıda yoxdur\? Təklif et/, 'search no-result CTA copy must remain explicit.');
assert.doesNotMatch(clubListSource, /\/elaqe\?club=/, 'search no-result proposal must not label free-text search as an existing club identity.');

assert.doesNotMatch(contactSource, /\/klub-sahibi/, 'contact page must not link to the removed club-owner flow.');

console.log('Submission regression contract: PASS');
