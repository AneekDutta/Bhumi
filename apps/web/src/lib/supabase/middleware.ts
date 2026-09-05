import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return new NextResponse('Authentication is not configured.', { status: 503 });
  }
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session — must not be removed
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Network or offline fallback
  }

  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const publicPaths = ['/login', '/auth/callback', '/auth/confirm', '/landowner/login', '/landowner/register'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  const isAuthenticated = !!user;
  const parsedRole = user?.user_metadata?.role || null;

  // 1. If unauthenticated and accessing a protected path:
  if (!isAuthenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith('/landowner')) {
      url.pathname = '/landowner/login';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  // 2. Strict Role-Based Access Control (RBAC):
  // Field Officers are strictly restricted to /field/* routes
  if (parsedRole === 'FIELD_OFFICER') {
    if (isPublicPath) {
      return supabaseResponse;
    }
    if (!pathname.startsWith('/field')) {
      const url = request.nextUrl.clone();
      url.pathname = '/field/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Landowners are strictly restricted to /landowner/* routes
  if (parsedRole === 'LANDOWNER') {
    if (isPublicPath) {
      return supabaseResponse;
    }
    if (!pathname.startsWith('/landowner')) {
      const url = request.nextUrl.clone();
      url.pathname = '/landowner/home';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
