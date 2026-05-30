import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'

// Route Handlers can mutate cookies, unlike Server Components.
// The onboarding page redirects here on a 401 from the backend so that the
// Supabase session cookies are actually cleared before we land on /login.
async function handle(request: Request) {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}

export const GET = handle
export const POST = handle
