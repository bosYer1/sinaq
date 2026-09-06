// Run with Node 24 on the Windows computer where `wrangler login` succeeded.
// Downloads the reviewed commit into a new temporary directory. No Git required.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const sourceCommit = '2d30a09e0393eeb52f676c1c26ccbb11a6d75358';

function isEmptyConfigValue(value) {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    return Object.values(value).every(isEmptyConfigValue);
  }
  return false;
}

export function guardConfig(config) {
  assert.equal(config.name, 'gameyer-standby', 'Unexpected Worker name');
  assert.equal(config.vars?.CLOUDFLARE_STANDBY, '1', 'Standby flag must remain enabled');
  assert.equal(config.vars?.NEXT_PUBLIC_SITE_URL, 'https://gameyer.az', 'Canonical changed');
  for (const key of ['route', 'routes', 'triggers', 'kv_namespaces', 'r2_buckets',
    'd1_databases', 'durable_objects', 'queues', 'images', 'ai', 'browser',
    'containers', 'email', 'send_email', 'pipelines', 'secrets_store_secrets',
    'services', 'dispatch_namespaces', 'unsafe', 'env', 'build']) {
    const value = config[key];
    assert.ok(isEmptyConfigValue(value), `Refusing deployment with ${key}`);
  }
  assert.ok(!config.usage_model, 'Refusing an explicit billing model');
  assert.ok(config.workers_dev !== false, 'workers.dev must be enabled');
  const vars = Object.keys(config.vars ?? {});
  assert.ok(vars.every(key => ['CLOUDFLARE_STANDBY', 'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].includes(key)),
  'Unexpected runtime variable');
}

export function standbyOrigin(output) {
  const matches = [...output.matchAll(/https:\/\/gameyer-standby\.[a-z0-9-]+\.workers\.dev(?=[\s/]|$)/g)];
  const origins = [...new Set(matches.map(match => new URL(match[0]).origin))];
  assert.equal(origins.length, 1, 'Deployment did not report exactly one standby workers.dev URL');
  return origins[0];
}

function run(executable, args, cwd, env, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let stdout = '';
    if (capture) {
      child.stdout.on('data', chunk => { stdout += chunk; });
      // Do not persist raw authentication/deployment output or diagnostic logs.
      child.stderr.on('data', () => {});
    }
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout) :
      reject(new Error(`Command failed (exit ${code}). Current stage was not completed.`)));
  });
}

async function get(url) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `Readiness request failed: ${new URL(url).pathname}`);
  return response;
}

async function main() {
  assert.equal(process.platform, 'win32', 'Run this helper on your authenticated Windows computer');
  assert.equal(Number(process.versions.node.split('.')[0]), 24, 'This repository requires Node.js 24');
  const work = await mkdtemp(path.join(tmpdir(), 'gameyer-standby-'));
  console.log(`Working directory: ${work}`);
  const archive = await fetch(`https://github.com/bosYer1/sinaq/archive/${sourceCommit}.zip`,
    { signal: AbortSignal.timeout(120000) });
  assert.ok(archive.ok, 'Could not download the reviewed public source');
  const zip = path.join(work, 'source.zip');
  await writeFile(zip, Buffer.from(await archive.arrayBuffer()));
  await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'Expand-Archive -LiteralPath $env:GAMEYER_ARCHIVE -DestinationPath $env:GAMEYER_EXTRACT'], work,
  { ...process.env, GAMEYER_ARCHIVE: zip, GAMEYER_EXTRACT: work });
  const repo = path.join(work, `sinaq-${sourceCommit}`);
  const env = { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false',
    WRANGLER_LOG: 'info', NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SITE_URL: 'https://gameyer.az', VERCEL_ENV: 'production' };
  // The isolated source has no local .env files. Also exclude inherited app secrets.
  for (const key of Object.keys(env)) {
    if (/^(SUPABASE_|DATABASE_URL$|POSTGRES_|DR_|NEXT_PUBLIC_)/.test(key)) delete env[key];
  }
  delete env.CLOUDFLARE_STANDBY;
  env.NEXT_PUBLIC_SITE_URL = 'https://gameyer.az';
  // Only the public read configuration already committed in the reviewed source is used.
  const publicConfig = await readFile(path.join(repo, 'src/lib/supabase/public-config.ts'), 'utf8');
  env.NEXT_PUBLIC_SUPABASE_URL = publicConfig.match(/PRODUCTION_SUPABASE_URL = '([^']+)'/)?.[1];
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = publicConfig.match(/PRODUCTION_SUPABASE_PUBLISHABLE_KEY = '([^']+)'/)?.[1];
  assert.ok(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Public configuration missing');
  const npm = async args => run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c',
    `npm.cmd ${args.join(' ')}`], repo, env);
  console.log('Installing locked dependencies...');
  await npm(['ci', '--no-audit', '--no-fund']);
  const wrangler = path.join(repo, 'node_modules/wrangler/bin/wrangler.js');
  console.log('Checking the existing Cloudflare login...');
  const identity = JSON.parse(await run(process.execPath, [wrangler, 'whoami', '--json'], repo, env, true));
  assert.equal(identity.loggedIn, true, 'Cloudflare login is required on this computer');
  assert.equal(identity.accounts?.length, 1, 'More than one Cloudflare account is available; explicit account selection is required');
  const accountId = identity.accounts[0].id;
  assert.match(accountId, /^[a-f0-9]{32}$/i, 'Invalid account ID');
  env.CLOUDFLARE_ACCOUNT_ID = accountId;
  delete env.CLOUDFLARE_ENV;
  console.log('Existing Cloudflare login verified. Running checks and build...');
  await npm(['test']);
  await npm(['run', 'typecheck']);
  await npm(['run', 'lint']);
  await npm(['audit', '--omit=dev', '--audit-level=high']);
  guardConfig(JSON.parse(await readFile(path.join(repo, 'wrangler.jsonc'), 'utf8')));
  env.CLOUDFLARE_STANDBY = '1';
  await npm(['run', 'build:vinext']);
  const configFile = path.join(repo, 'dist/server/wrangler.json');
  const config = JSON.parse(await readFile(configFile, 'utf8'));
  guardConfig(config);
  config.account_id = accountId;
  config.workers_dev = true;
  config.preview_urls = false;
  config.vars.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  config.vars.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  await writeFile(configFile, JSON.stringify(config, null, 2));
  console.log('Validating the Worker upload (dry run)...');
  await run(process.execPath, [wrangler, 'deploy', '--config', configFile, '--dry-run'], repo, env, true);
  console.log('Deploying gameyer-standby to the authenticated permanent account...');
  const output = await run(process.execPath, [wrangler, 'deploy', '--config', configFile], repo, env, true);
  const origin = standbyOrigin(output);
  console.log(`Worker deployed: ${origin}`);
  const checkEnv = { ...env, DR_BASE_URL: origin, DR_EXPECT_STANDBY: '1', DR_EXPECT_ANALYTICS_WRITE: 'disabled' };
  const checks = JSON.parse(await run(process.execPath,
    [path.join(repo, 'scripts/dr-readiness-check.mjs')], repo, checkEnv, true));
  const sitemap = await (await get(`${origin}/sitemap.xml`)).text();
  const club = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => new URL(match[1])).find(url => url.pathname.startsWith('/klub/'));
  assert.ok(club && club.origin === 'https://gameyer.az', 'Missing real canonical club URL');
  for (const pathname of ['/', club.pathname]) {
    const response = await get(new URL(pathname, origin));
    assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i);
    const html = await response.text();
    const links = html.match(/<link\b[^>]*>/gi) ?? [];
    assert.ok(links.some(tag => /\brel=["']canonical["']/i.test(tag) &&
      tag.includes(`href="https://gameyer.az${pathname === '/' ? '' : pathname}"`)) ||
      (pathname === '/' && links.some(tag => /\brel=["']canonical["']/i.test(tag) && tag.includes('href="https://gameyer.az/"'))),
    `Canonical metadata failed: ${pathname}`);
    assert.ok((html.match(/<meta\b[^>]*>/gi) ?? []).some(tag =>
      /\bname=["']robots["']/i.test(tag) && /noindex/i.test(tag)), `Noindex metadata failed: ${pathname}`);
  }
  const report = { ...checks, source_commit: sourceCommit, checked_at: new Date().toISOString(),
    canonical_and_metadata: 'passed', worker_version: output.match(/Current Version ID:\s*([a-f0-9-]+)/i)?.[1] ?? null };
  await writeFile(path.join(work, 'standby-readiness.json'), JSON.stringify(report, null, 2));
  console.log(`PASS: ${origin}\nReport: ${path.join(work, 'standby-readiness.json')}`);
  console.log('Share only the Worker URL and readiness report. Canonical DNS rehearsal is still pending.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
