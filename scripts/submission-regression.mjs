import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [actionSource, formSource, contactSource, ownerSource] = await Promise.all([
  readFile(new URL('../src/app/submissions/actions.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/submissions/SubmissionForm.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/elaqe/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/klub-sahibi/page.tsx', import.meta.url), 'utf8'),
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
assert.match(formSource, /kind="new_club"/, 'contact page must continue exposing new club submissions');
assert.match(contactSource, /params\.sent === '1'/, 'contact page must render success feedback');
assert.match(contactSource, /params\.error === '1'/, 'contact page must render failure feedback');
assert.match(ownerSource, /kind="owner_claim"/, 'club-owner page must continue exposing owner claims');
assert.match(ownerSource, /params\.sent === '1'/, 'club-owner page must render success feedback');

console.log('Submission regression contract: PASS');
