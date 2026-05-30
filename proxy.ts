import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client'

const PROTECTED_ROUTES = ['/onboarding', '/dashboard']
const AUTH_ROUTES = ['/login', '/register']

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Must pass response to middleware client so it can mutate cookies
  const response = NextResponse.next({ request })

  const supabase = getSupabaseMiddlewareClient(request, response)

  // Always use getUser() — validates the JWT server-side, unlike getSession() which only reads the cookie
  const { data: { user } } = await supabase.auth.getUser()

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute(pathname) && user) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Return the same response — it carries any refreshed session cookies
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
