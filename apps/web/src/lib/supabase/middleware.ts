import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  UserRole,
  isPublicRoute,
  getRequiredRoleForRoute,
  canRoleAccessRoute,
  ROLE_LOGIN_PATHS,
} from '@/lib/routes';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykxcoihvfzgykrkabbdy.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGNvaWh2ZnpneWtya2FiYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTEyNzEsImV4cCI6MjEwNDAyNzI3MX0.8-0CWlQjD-2IO3T0d5c5u6AJOWfKeHpCUMDYSzuDUCE';
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

  const { pathname, search } = request.nextUrl;
  const fullPathWithQuery = `${pathname}${search}`;

  // Never redirect internal API calls to HTML pages
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // =============================================================================
  // 1. DEV / EVALUATION ROLE SWITCHING HELPER
  // =============================================================================
  if (request.nextUrl.searchParams.get('switch') === 'admin') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('switch');
    redirectUrl.pathname = '/dashboard';
    const response = NextResponse.redirect(redirectUrl);
    const sessionData = {
      officer_id: 'OFF-CALA-01',
      name: 'Sh. Rajesh Kumar',
      email: 'officer@kosh.sih2026.org',
      role: 'ADMIN',
    };
    const sessionCookie = encodeURIComponent(JSON.stringify(sessionData));
    response.cookies.set('kosh_user_role', 'ADMIN', { path: '/', maxAge: 86400 * 7, sameSite: 'lax' });
    response.cookies.set('bhumi_user_role', 'ADMIN', { path: '/', maxAge: 86400 * 7, sameSite: 'lax' });
    response.cookies.set('kosh_officer_session', sessionCookie, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('bhumi_officer_session', sessionCookie, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    response.cookies.delete('kosh_landowner_session');
    response.cookies.delete('bhumi_landowner_session');
    return response;
  }

  if (request.nextUrl.searchParams.get('switch') === 'field') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('switch');
    redirectUrl.pathname = '/field/dashboard';
    const response = NextResponse.redirect(redirectUrl);
    const sessionData = {
      officer_id: 'OFF-001',
      name: 'Ramesh Patel',
      designation: 'Patwari / Revenue Lekhpal',
      assigned_villages: ['Ramganj Mandi', 'Kanhera Kalan', 'Wagholi'],
      role: 'FIELD_OFFICER',
    };
    const fieldCookie = encodeURIComponent(JSON.stringify(sessionData));
    response.cookies.set('kosh_user_role', 'FIELD_OFFICER', { path: '/', maxAge: 86400 * 7, sameSite: 'lax' });
    response.cookies.set('bhumi_user_role', 'FIELD_OFFICER', { path: '/', maxAge: 86400 * 7, sameSite: 'lax' });
    response.cookies.set('kosh_officer_session', fieldCookie, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('bhumi_officer_session', fieldCookie, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    response.cookies.delete('kosh_landowner_session');
    response.cookies.delete('bhumi_landowner_session');
    return response;
  }

  if (request.nextUrl.searchParams.get('switch') === 'landowner') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('switch');
    redirectUrl.pathname = '/landowner/home';
    const response = NextResponse.redirect(redirectUrl);
    const sessionData = {
      owner_id: 'O00004',
      name: 'Geeta Meena',
      contact_village: 'Chandwas (V03)',
      role: 'LANDOWNER',
    };
    const loCookie = encodeURIComponent(JSON.stringify(sessionData));
    response.cookies.set('kosh_user_role', 'LANDOWNER', { path: '/', maxAge: 86400 * 7, sameSite: 'lax' });
    response.cookies.set('bhumi_user_role', 'LANDOWNER', { path: '/', maxAge: 86400 * 7, sameSite: 'lax' });
    response.cookies.set('kosh_landowner_session', loCookie, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('bhumi_landowner_session', loCookie, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });
    response.cookies.delete('kosh_officer_session');
    response.cookies.delete('bhumi_officer_session');
    return response;
  }

  // =============================================================================
  // 2. STRICT SESSION & ROLE DETECTION
  // =============================================================================
  const userRoleCookie = request.cookies.get('kosh_user_role')?.value || request.cookies.get('bhumi_user_role')?.value;
  const officerSessionCookie = request.cookies.get('kosh_officer_session')?.value || request.cookies.get('bhumi_officer_session')?.value;
  const landownerSessionCookie = request.cookies.get('kosh_landowner_session')?.value || request.cookies.get('bhumi_landowner_session')?.value;

  let parsedRole: UserRole | null = null;

  // Check explicit cookie role first
  if (userRoleCookie === 'ADMIN' || userRoleCookie === 'FIELD_OFFICER' || userRoleCookie === 'LANDOWNER') {
    parsedRole = userRoleCookie as UserRole;
  }

  // Check Supabase metadata if role is not determined
  if (!parsedRole && user?.user_metadata?.role) {
    const metaRole = String(user.user_metadata.role).toUpperCase();
    if (metaRole === 'ADMIN' || metaRole === 'FIELD_OFFICER' || metaRole === 'LANDOWNER') {
      parsedRole = metaRole as UserRole;
    }
  }

  // Fallback to officer session payload
  if (!parsedRole && officerSessionCookie) {
    try {
      const decoded = decodeURIComponent(officerSessionCookie);
      const parsed = JSON.parse(decoded);
      if (parsed?.role === 'ADMIN' || parsed?.role === 'FIELD_OFFICER') {
        parsedRole = parsed.role;
      }
    } catch {
      try {
        const parsed = JSON.parse(officerSessionCookie);
        if (parsed?.role === 'ADMIN' || parsed?.role === 'FIELD_OFFICER') {
          parsedRole = parsed.role;
        }
      } catch {}
    }
  }

  // Fallback to landowner session payload
  if (!parsedRole && landownerSessionCookie) {
    try {
      const decoded = decodeURIComponent(landownerSessionCookie);
      const parsed = JSON.parse(decoded);
      if (parsed?.role === 'LANDOWNER' || parsed?.user_id || parsed?.owner_id) {
        parsedRole = 'LANDOWNER';
      }
    } catch {
      try {
        const parsed = JSON.parse(landownerSessionCookie);
        if (parsed?.role === 'LANDOWNER' || parsed?.user_id || parsed?.owner_id) {
          parsedRole = 'LANDOWNER';
        }
      } catch {}
    }
  }

  // =============================================================================
  // 3. PUBLIC ROUTES
  // =============================================================================
  if (isPublicRoute(pathname)) {
    // If authenticated user visits THEIR OWN login page, redirect to their dashboard
    if (pathname === '/login' && parsedRole === 'ADMIN') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    if (pathname === '/field/login' && parsedRole === 'FIELD_OFFICER') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/field/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    if (pathname === '/landowner/login' && parsedRole === 'LANDOWNER') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/landowner/home';
      return NextResponse.redirect(redirectUrl);
    }

    // Otherwise, allow public route access freely (no cookie mutations, no silent bounces)
    return supabaseResponse;
  }

  // =============================================================================
  // 4. PROTECTED ROUTES ACCESS CONTROL
  // =============================================================================
  const requiredRole = getRequiredRoleForRoute(pathname);

  // Case A: Unauthenticated access to protected route -> Redirect to role-specific login with ?next=
  if (!parsedRole) {
    const redirectUrl = request.nextUrl.clone();
    const loginGateway = requiredRole ? ROLE_LOGIN_PATHS[requiredRole] : '/login';
    redirectUrl.pathname = loginGateway;
    redirectUrl.search = '';
    redirectUrl.searchParams.set('next', fullPathWithQuery);
    return NextResponse.redirect(redirectUrl);
  }

  // Case B: Authenticated access to root portal index paths -> Clean redirect to dashboard
  if (pathname === '/field') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/field/dashboard';
    return NextResponse.redirect(redirectUrl);
  }
  if (pathname === '/landowner') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/landowner/home';
    return NextResponse.redirect(redirectUrl);
  }

  // Case C: Role Mismatch -> Explicit 403 /unauthorized page (NEVER silent fallback redirect)
  if (!canRoleAccessRoute(parsedRole, pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/unauthorized';
    redirectUrl.search = '';
    if (requiredRole) redirectUrl.searchParams.set('required', requiredRole);
    redirectUrl.searchParams.set('current', parsedRole);
    redirectUrl.searchParams.set('from', fullPathWithQuery);
    return NextResponse.redirect(redirectUrl);
  }

  // Case D: Role matches required permissions -> Proceed
  return supabaseResponse;
}
