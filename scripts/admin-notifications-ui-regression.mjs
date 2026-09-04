import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const layout = await readFile(new URL('../src/app/admin/layout.tsx', import.meta.url), 'utf8');
const page = await readFile(new URL('../src/app/admin/bildirisler/page.tsx', import.meta.url), 'utf8');
const actions = await readFile(new URL('../src/app/admin/bildirisler/actions.ts', import.meta.url), 'utf8');

assert.ok(layout.includes(".from('admin_notifications')"), 'Admin layout must derive the unread badge from the real notification table.');
assert.ok(layout.includes(".is('read_at', null)"), 'Unread badge must count only unread notifications.');
assert.ok(layout.includes('href="/admin/bildirisler"'), 'Admin navigation must expose the notification inbox.');
assert.ok(page.includes("await requireAdmin()"), 'Notification inbox must require the hardened admin + AAL2 guard.');
assert.ok(page.includes(".from('admin_notifications')"), 'Notification inbox must read persisted notifications.');
assert.ok(page.includes(".order('created_at', { ascending: false })"), 'Notification inbox must keep newest items first.');
assert.ok(actions.includes("await requireAdmin()"), 'Notification mutations must require hardened admin + AAL2 authorization.');
assert.ok(actions.includes(".is('read_at', null)"), 'Read actions must operate only on unread notifications.');
assert.ok(actions.includes("revalidatePath('/admin', 'layout')"), 'Read actions must refresh the unread badge.');

console.log('admin notifications UI regression: ok');
