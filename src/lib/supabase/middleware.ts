import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '../types/database';
import { env } from '../env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT remove this. This is required for Next.js Middleware to work
  // with Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes starting with dashboard, conversations, analytics, audit-log, and settings
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                            request.nextUrl.pathname.startsWith('/conversations') ||
                            request.nextUrl.pathname.startsWith('/analytics') ||
                            request.nextUrl.pathname.startsWith('/audit-log') ||
                            request.nextUrl.pathname.startsWith('/settings');

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
