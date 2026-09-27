const isProduction = process.env.VERCEL_ENV === 'production';

if (!isProduction) {
  console.log('OIDC build canary: skipped outside Vercel production');
  process.exit(0);
}

const token = process.env.VERCEL_OIDC_TOKEN?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://uxcedpbumulpheglhlvs.supabase.co';
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'sb_publishable_ZRyHR5Qj2LmbCZVsKTBZ4Q_eRByoSYf';

if (!token) {
  throw new Error('OIDC build canary: VERCEL_OIDC_TOKEN is missing in production build');
}

const target = new URL('/rest/v1/clubs', supabaseUrl);
target.searchParams.set('select', 'id');
target.searchParams.set('is_active', 'eq.true');
target.searchParams.set('limit', '1');

const response = await fetch(`${supabaseUrl}/functions/v1/gameyer-public-data-proxy`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-gameyer-vercel-oidc': token,
    apikey: publishableKey,
  },
  body: JSON.stringify({
    url: target.toString(),
    method: 'GET',
    headers: { accept: 'application/json' },
  }),
});

if (!response.ok) {
  throw new Error(`OIDC build canary: trusted bridge returned ${response.status}`);
}

const rows = await response.json();
if (!Array.isArray(rows) || rows.length < 1) {
  throw new Error('OIDC build canary: trusted bridge returned no active clubs');
}

console.log('OIDC build canary: PASS');
