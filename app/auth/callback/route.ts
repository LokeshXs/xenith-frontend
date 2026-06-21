import { NextResponse, type NextRequest } from 'next/server'
import { getPostLoginRoute } from '@/lib/auth/post-login-route'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'

const RESET_PASSWORD_ROUTE = '/reset-password'
const RECOVERY_COOKIE = 'xenith-password-recovery'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next')
  const isPasswordRecovery = requestedNext === RESET_PASSWORD_ROUTE
  const next = isPasswordRecovery
    ? RESET_PASSWORD_ROUTE
    : getPostLoginRoute(requestedNext)

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`)

      if (isPasswordRecovery) {
        response.cookies.set(RECOVERY_COOKIE, '1', {
          httpOnly: true,
          maxAge: 10 * 60,
          path: RESET_PASSWORD_ROUTE,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }

      return response
    }
  }

  const errorRoute = isPasswordRecovery
    ? '/forgot-password?error=invalid-link'
    : '/login?error=oauth'

  return NextResponse.redirect(`${origin}${errorRoute}`)
}
