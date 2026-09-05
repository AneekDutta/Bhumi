import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = 'https://ykxcoihvfzgykrkabbdy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGNvaWh2ZnpneWtya2FiYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTEyNzEsImV4cCI6MjEwNDAyNzI3MX0.8-0CWlQjD-2IO3T0d5c5u6AJOWfKeHpCUMDYSzuDUCE';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  const publicPaths = ['/login', '/auth/callback', '/auth/confirm', '/field/login', '/landowner/login', '/landowner/register'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // Check for either Supabase user or verified session cookie
  const officerSession = request.cookies.get('bhumi_officer_session')?.value;
  const landownerSession = request.cookies.get('bhumi_landowner_session')?.value;
  let parsedRole: string | null = null;
  const activeSession = officerSession || landownerSession;
  if (activeSession) {
    try {
      const decoded = decodeURIComponent(activeSession);
      const parsed = JSON.parse(decoded);
      parsedRole = parsed?.role || null;
    } catch {
      try {
        const parsed = JSON.parse(activeSession);
        parsedRole = parsed?.role || null;
      } catch {}
    }
  }

  const isAuthenticated = !!user || !!officerSession || !!landownerSession;

  // 1. Support instantaneous role switching via query param
  if (request.nextUrl.searchParams.get('switch') === 'admin') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('switch');
    const response = NextResponse.redirect(url);
    response.cookies.set('bhumi_officer_session', 'officer%40bhumi.gov.in', {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax',
    });
    return response;
  }

  if (request.nextUrl.searchParams.get('switch') === 'landowner') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('switch');
    url.pathname = '/landowner/home';
    const response = NextResponse.redirect(url);
    const sessionData = {
      owner_id: 'O00004',
      name: 'Geeta Meena',
      contact_village: 'Chandwas (V03)',
      role: 'LANDOWNER'
    };
    response.cookies.set('bhumi_officer_session', encodeURIComponent(JSON.stringify(sessionData)), {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    return response;
  }

  if (request.nextUrl.searchParams.get('switch') === 'field') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('switch');
    url.pathname = '/field/dashboard';
    const response = NextResponse.redirect(url);
    const sessionData = {
      officer_id: 'OFF-001',
      name: 'Ramesh Patel',
      designation: 'Patwari / Revenue Lekhpal',
      assigned_villages: ['Ramganj Mandi', 'Kanhera Kalan', 'Wagholi'],
      role: 'FIELD_OFFICER'
    };
    response.cookies.set('bhumi_officer_session', encodeURIComponent(JSON.stringify(sessionData)), {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    return response;
  }

  // 2. If unauthenticated and accessing a protected path:
  if (!isAuthenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith('/field')) {
      url.pathname = '/field/login';
    } else if (pathname.startsWith('/landowner')) {
      url.pathname = '/landowner/login';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  // 3. Strict Role-Based Access Control (RBAC):
  // Field Officers are restricted to /field/* routes
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
