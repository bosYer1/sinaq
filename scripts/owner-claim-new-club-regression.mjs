import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [ownerForm, ownerNewClubPage, ownerNewClubAction, submissionsPage, ownerActions] = await Promise.all([
  readFile(new URL('../src/components/admin/OwnerClaimApplyForm.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/muracietler/[id]/yeni-klub/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/muracietler/new-owner-club-actions.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/muracietler/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/muracietler/actions.ts', import.meta.url), 'utf8'),
]);

assert.match(ownerForm, /Bazad[a-zəıöüşçğ ]*yoxdur — yeni klub yarat/i, 'unmatched owner claims must expose a create-new-club path');
assert.match(ownerForm, /\/admin\/muracietler\/\$\{encodeURIComponent\(id\)\}\/yeni-klub/, 'new-club action must stay scoped to the owner submission id');
assert.match(ownerNewClubPage, /\.eq\('kind', 'owner_claim'\)/, 'new-club page must load owner claims only');
assert.match(ownerNewClubPage, /!submission\.club_id/, 'already-linked owner claims must not create a second club');
assert.match(ownerNewClubPage, /inactive \+ unverified/, 'admin must be told that creation does not verify ownership');

assert.match(ownerNewClubAction, /\.eq\('kind', 'owner_claim'\)/, 'server action must be owner-claim scoped');
assert.match(ownerNewClubAction, /\.is\('club_id', null\)/, 'server action must reject already-linked claims');
assert.match(ownerNewClubAction, /requiredCoordinate\(formData, 'latitude'/, 'new owner clubs must require verified latitude');
assert.match(ownerNewClubAction, /requiredCoordinate\(formData, 'longitude'/, 'new owner clubs must require verified longitude');
assert.match(ownerNewClubAction, /Yeni owner klubu üçün təsdiqlənmiş Instagram profil linki tələb olunur/, 'new owner clubs must require a verified Instagram');
assert.match(ownerNewClubAction, /Ən azı bir təsdiqlənmiş klub tipi seçilməlidir/, 'new owner clubs must require at least one verified platform type');
assert.match(ownerNewClubAction, /is_active: false/, 'new owner-claim clubs must never be public at creation time');
assert.match(ownerNewClubAction, /is_verified: false/, 'club creation must not silently verify ownership');
assert.match(ownerNewClubAction, /status: 'reviewing'/, 'claim must remain under review after the new club is linked');
assert.match(ownerNewClubAction, /rollbackCreatedOwnerClub/, 'partial owner-club creation must have rollback protection');
assert.match(ownerNewClubAction, /linkedSubmission\?\.club_id !== clubId/, 'concurrent claim linking must be verified before success');

assert.doesNotMatch(submissionsPage, /linkOwnerClaimToClub/, 'owner claims must not show the legacy duplicate linking form');
assert.match(submissionsPage, /canLinkExistingCorrection/, 'legacy linking UI must remain only for correction submissions');
assert.match(ownerActions, /verify_owner_claim_atomic/, 'final owner approval must continue through the atomic verification RPC');

console.log('owner claim new-club regression checks passed');
