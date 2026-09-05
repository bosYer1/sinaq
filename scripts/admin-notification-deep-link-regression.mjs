import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const inbox = await readFile(new URL('../src/app/admin/bildirisler/page.tsx', import.meta.url), 'utf8');
const actions = await readFile(new URL('../src/app/admin/bildirisler/actions.ts', import.meta.url), 'utf8');
const detail = await readFile(new URL('../src/app/admin/muracietler/[id]/page.tsx', import.meta.url), 'utf8');

assert.ok(inbox.includes("select('id', { count: 'exact', head: true })"), 'Inbox unread total must use an exact DB count instead of only the latest 100 rows.');
assert.ok(inbox.includes('action={openSubmissionNotification}'), 'Submission notifications must use the guarded open action.');
assert.ok(!inbox.includes('href="/admin/muracietler" className="inline-flex h-9'), 'Notification CTA must not dump admins into the generic submission queue.');

assert.ok(actions.includes('export async function openSubmissionNotification'), 'Deep-link action must exist.');
assert.ok(actions.includes(".select('id,submission_id,read_at')"), 'Deep-link action must resolve the persisted notification target server-side.');
assert.ok(actions.includes(".update({ read_at: new Date().toISOString() })"), 'Opening an unread notification must mark it read.');
assert.ok(actions.includes('redirect(`/admin/muracietler/${encodeURIComponent(notification.submission_id)}`)'), 'Deep-link action must redirect only to its exact persisted submission id.');
assert.ok(actions.includes('await requireAdmin()'), 'Notification deep-link access must preserve admin + AAL2 authorization.');

assert.ok(detail.includes('await requireAdmin()'), 'Exact submission page must preserve admin + AAL2 authorization.');
assert.ok(detail.includes(".eq('id', id)"), 'Exact submission page must query by the route submission id.');
assert.ok(detail.includes('if (!data) notFound()'), 'Unknown submission ids must fail closed with not-found.');
assert.ok(detail.includes('<OwnerClaimApplyForm'), 'Exact owner claim view must preserve the owner approval workflow.');
assert.ok(detail.includes('action={updateSubmissionStatus}'), 'Exact submission view must preserve status operations.');

console.log('admin notification deep-link regression: ok');
