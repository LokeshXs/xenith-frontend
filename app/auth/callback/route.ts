import { NextResponse, type NextRequest } from 'next/server'
import { getPostLoginRoute } from '@/lib/auth/post-login-route'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import type { SupabaseClient } from '@supabase/supabase-js'

const RESET_PASSWORD_ROUTE = '/reset-password'
const RECOVERY_COOKIE = 'xenith-password-recovery'

function metadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function profileNameFromMetadata(metadata: Record<string, unknown>): string | undefined {
  return (
    metadataString(metadata, 'name') ??
    metadataString(metadata, 'full_name') ??
    metadataString(metadata, 'display_name')
  )
}

async function syncProfileFromAuthUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const name = profileNameFromMetadata(user.user_metadata)
  const email = user.email ?? undefined
  if (!name && !email) return

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('name,email')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) return

  if (!existing) {
    await supabase
      .from('profiles')
      .upsert({ id: user.id, ...(email ? { email } : {}), ...(name ? { name } : {}) })
    return
  }

  const updates = {
    ...(!existing.email && email ? { email } : {}),
    ...(!existing.name?.trim() && name ? { name } : {}),
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('profiles').update(updates).eq('id', user.id)
  }
}

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
      try {
        await syncProfileFromAuthUser(supabase)
      } catch {
        // The database trigger is the primary profile sync path. This callback
        // write is best-effort so auth redirects are not blocked by RLS.
      }
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
