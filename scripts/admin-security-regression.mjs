import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [layout, middleware] = await Promise.all([
  readFile(new URL('../src/app/admin/layout.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/middleware.ts', import.meta.url), 'utf8').catch(() => ''),
]);

assert.match(layout, /supabase\.auth\.getUser\(\)/, 'admin layout must validate the authenticated user');
assert.match(layout, /\.from\('admin_users'\)/, 'admin layout must require admin_users membership');
assert.match(layout, /mfa\.getAuthenticatorAssuranceLevel\(\)/, 'admin layout must check MFA assurance level');
assert.match(layout, /currentLevel === 'aal2'/, 'admin layout must require AAL2');
assert.match(layout, /if \(!isAdmin \|\| !hasAal2\)/, 'protected admin navigation must remain hidden before admin+AAL2');
assert.match(layout, /robots:[\s\S]*index: false[\s\S]*follow: false/, 'admin routes must remain noindex/nofollow');
assert.doesNotMatch(layout, /service_role|sb_secret_/i, 'admin layout must not contain private Supabase credentials');
if (middleware) assert.doesNotMatch(middleware, /allowAdminWithoutMfa|skipMfa|bypassMfa/i, 'middleware must not contain an MFA bypass');

console.log('Admin security regression contract: PASS');
