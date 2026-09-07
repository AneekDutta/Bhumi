import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectUrl, UserRole } from '@/lib/routes';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const rawRole = (data.user.user_metadata?.role as string)?.toUpperCase();
      let role: UserRole = 'LANDOWNER';
      if (rawRole === 'ADMIN' || rawRole === 'FIELD_OFFICER' || rawRole === 'LANDOWNER') {
        role = rawRole as UserRole;
      }

      const safeDestination = getSafeRedirectUrl(role, next);
      const response = NextResponse.redirect(`${origin}${safeDestination}`);

      // Establish official role cookie
      response.cookies.set('bhumi_user_role', role, {
        path: '/',
        maxAge: 86400 * 7,
        sameSite: 'lax',
      });

      return response;
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
