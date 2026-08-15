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

  if (pathname.startsWith('/admin/login')) {
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    const redirect = NextResponse.redirect(homeUrl);
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }

  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
