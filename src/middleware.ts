import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const pathname =
    request.nextUrl.pathname;

  /*
   * Login səhifəsi public qalır.
   */
  if (
    pathname.startsWith(
      '/admin/login'
    )
  ) {
    return response;
  }

  /*
   * User həqiqətən login olub?
   */
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      '/admin/login';

    loginUrl.searchParams.set(
      'next',
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
   * Login olubsa, admin_users-da var?
   */
  const {
    data: adminRow,
    error: adminError,
  } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (
    adminError ||
    !adminRow
  ) {
    /*
     * Admin olmayan user-i public ana səhifəyə qaytarırıq.
     */
    const homeUrl =
      request.nextUrl.clone();

    homeUrl.pathname = '/';
    homeUrl.search = '';

    return NextResponse.redirect(
      homeUrl
    );
  }

  /*
   * Authenticated route-lar cache olunmasın.
   */
  response.headers.set(
    'Cache-Control',
    'private, no-store'
  );

  return response;
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
};
