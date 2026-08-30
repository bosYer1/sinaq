import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [layout, login, logout, middleware] = await Promise.all([
  readFile(new URL('../src/app/admin/layout.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/app/admin/login/page.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/admin/LogoutButton.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/middleware.ts', import.meta.url), 'utf8').catch(() => ''),
]);

assert.match(layout, /supabase\.auth\.getUser\(\)/, 'every admin layout render must validate the current authenticated user/session');
assert.match(layout, /\.from\('admin_users'\)/, 'admin layout must require admin_users membership');
assert.match(layout, /\.eq\('user_id', user\.id\)/, 'admin membership must be scoped to the current authenticated user');
assert.match(layout, /mfa\.getAuthenticatorAssuranceLevel\(\)/, 'admin layout must check MFA assurance level');
assert.match(layout, /currentLevel === 'aal2'/, 'admin layout must require AAL2');
assert.match(layout, /if \(!isAdmin \|\| !hasAal2\)/, 'protected admin navigation must remain hidden before admin+AAL2');
assert.match(layout, /robots:[\s\S]*index: false[\s\S]*follow: false/, 'admin routes must remain noindex/nofollow');
assert.doesNotMatch(layout, /service_role|sb_secret_/i, 'admin layout must not contain private Supabase credentials');

assert.match(login, /signInWithPassword/, 'admin login must authenticate through Supabase');
assert.match(login, /\.from\('admin_users'\)/, 'login must verify admin membership');
assert.match(login, /if \(adminError \|\| !adminRow\)[\s\S]*signOut\(\)/, 'non-admin authenticated users must be signed out');
assert.doesNotMatch(login, /service_role|sb_secret_|bypassMfa|skipMfa/i, 'login must not contain privileged credentials or bypasses');

assert.match(logout, /supabase\.auth\.signOut\(\)/, 'logout must invalidate the Supabase session');
assert.match(logout, /window\.location\.replace\('\/admin\/login'\)/, 'logout must return to the admin login page without preserving protected history');
assert.doesNotMatch(logout, /localStorage\.setItem|sessionStorage\.setItem/, 'logout must not persist an authentication bypass');

if (middleware) assert.doesNotMatch(middleware, /allowAdminWithoutMfa|skipMfa|bypassMfa/i, 'middleware must not contain an MFA bypass');

console.log('Admin security regression contract: PASS');
