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

function privateRedirect(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (next) url.searchParams.set('next', next);
  const redirect = NextResponse.redirect(url);
  redirect.headers.set('Cache-Control', 'private, no-store');
  return redirect;
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
  matcher: ['/admin', '/admin/:path*'],
};
