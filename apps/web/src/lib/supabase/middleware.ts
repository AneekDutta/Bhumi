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
  const publicPaths = ['/login', '/auth/callback', '/auth/confirm', '/field/login'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // Check for either Supabase user or verified officer session cookie
  const officerSession = request.cookies.get('bhumi_officer_session')?.value;
  let parsedRole: string | null = null;
  if (officerSession) {
    try {
      const decoded = decodeURIComponent(officerSession);
      const parsed = JSON.parse(decoded);
      parsedRole = parsed?.role || null;
    } catch {
      try {
        const parsed = JSON.parse(officerSession);
        parsedRole = parsed?.role || null;
      } catch {}
    }
  }

  const isAuthenticated = !!user || !!officerSession;

  // 1. If unauthenticated and accessing a protected path:
  if (!isAuthenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith('/field') ? '/field/login' : '/login';
    return NextResponse.redirect(url);
  }

  // 2. Strict Role-Based Access Control (RBAC):
  // Field Officers are strictly restricted to /field/* routes
  if (parsedRole === 'FIELD_OFFICER') {
    if (!pathname.startsWith('/field')) {
      const url = request.nextUrl.clone();
      url.pathname = '/field/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
