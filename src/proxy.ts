import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from '@/lib/supabase/public-config';

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  secure?: boolean;
};

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

const SEO_INACTIVE_CLUB_TOMBSTONES = new Set([
  'alfa-rooms',
  'e-s-club-playstation',
  'fun-drive-baku-game-club',
  'game-stop-playstation-club',
  'gamer-hall-baku',
  'gamezone-internet-klub',
  'good-game-genclik',
  'haven-cyber-lounge',
  'next-level-cyberclub',
  'playstation-club-bakixanov-yavar-aliyev',
  'playstation-home-qara-qarayev',
  'prime-cyberclub',
  'real-club-playstation',
  'vegas-gaming-center-xezer',
  'x-game-arena',
]);

const INACTIVE_CLUB_BODY = `<!doctype html>
<html lang="az">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, follow" />
  <title>Klub tapılmadı | GameYer</title>
</head>
<body>
  <main>
    <h1>Klub tapılmadı</h1>
    <p>Bu klub hazırda GameYer-də aktiv deyil.</p>
    <p><a href="/">Digər gaming klublarına bax</a></p>
  </main>
</body>
</html>`;

function privateRedirect(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (next) url.searchParams.set('next', next);
  const redirect = NextResponse.redirect(url);
  redirect.headers.set('Cache-Control', 'private, no-store');
  return redirect;
}

function inactiveClubNotFound() {
  return new NextResponse(INACTIVE_CLUB_BODY, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, follow',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

function hasFreshAal2(aal: { currentLevel: string | null; nextLevel: string | null } | null | undefined) {
  return aal?.currentLevel === 'aal2' && aal.nextLevel === 'aal2';
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const clubSlug = pathname.startsWith('/klub/') ? decodeURIComponent(pathname.slice('/klub/'.length)) : null;

  if (clubSlug && SEO_INACTIVE_CLUB_TOMBSTONES.has(clubSlug)) {
    const { data: activeClub, error: activeClubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', clubSlug)
      .eq('is_active', true)
      .maybeSingle();

    // Fail open on a dependency error so a temporary Supabase problem cannot hide a valid club.
    if (activeClubError) return response;
    if (!activeClub) return inactiveClubNotFound();
    return response;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (pathname.startsWith('/admin/login')) {
    if (!userError && user) {
      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminRow) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        return privateRedirect(request, hasFreshAal2(aal) ? '/admin' : '/admin/mfa');
      }
    }

    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  if (userError || !user) {
    return privateRedirect(request, '/admin/login', pathname);
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    return privateRedirect(request, '/');
  }

  if (pathname.startsWith('/admin/mfa')) {
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || !hasFreshAal2(aal)) {
    return privateRedirect(request, '/admin/mfa', pathname);
  }

  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/klub/alfa-rooms',
    '/klub/e-s-club-playstation',
    '/klub/fun-drive-baku-game-club',
    '/klub/game-stop-playstation-club',
    '/klub/gamer-hall-baku',
    '/klub/gamezone-internet-klub',
    '/klub/good-game-genclik',
    '/klub/haven-cyber-lounge',
    '/klub/next-level-cyberclub',
    '/klub/playstation-club-bakixanov-yavar-aliyev',
    '/klub/playstation-home-qara-qarayev',
    '/klub/prime-cyberclub',
    '/klub/real-club-playstation',
    '/klub/vegas-gaming-center-xezer',
    '/klub/x-game-arena',
  ],
};
