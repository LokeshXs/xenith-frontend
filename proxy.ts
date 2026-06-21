import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPostLoginRoute } from '@/lib/auth/post-login-route'
import { getSupabaseMiddlewareClient } from '@/lib/supabase/middleware-client'

const PROTECTED_ROUTES = ['/onboarding', '/dashboard', '/billing']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

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

  // Validate the JWT claims instead of trusting the cookie contents.
  // getClaims() can verify asymmetric JWTs locally and refreshes the session
  // through the middleware client's cookie adapter when necessary.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims?.sub)

  function redirectWithRefreshedCookies(url: URL): NextResponse {
    const redirectResponse = NextResponse.redirect(url)

    // getClaims() may have refreshed the session. Preserve those Set-Cookie
    // headers when returning a redirect instead of the original response.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })

    return redirectResponse
  }

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return redirectWithRefreshedCookies(loginUrl)
  }

  if (isAuthRoute(pathname) && isAuthenticated) {
    const requestedRedirect = request.nextUrl.searchParams.get('redirectTo')
    return redirectWithRefreshedCookies(
      new URL(getPostLoginRoute(requestedRedirect), request.url),
    )
  }

  // Return the same response — it carries any refreshed session cookies
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
