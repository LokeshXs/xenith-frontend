import { getSupabaseBrowserClient } from './client'
import { getPostLoginRoute } from '@/lib/auth/post-login-route'
import type { AuthResult, AuthError, SignInCredentials, SignUpCredentials, Session, User } from './types'

export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword(credentials)
  return {
    user: data.user,
    session: data.session,
    error: error ? { message: error.message, status: error.status } : null,
  }
}

export async function signUp(
  credentials: SignUpCredentials,
  redirectTo = getPostLoginRoute(),
): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  })
  return {
    user: data.user,
    session: data.session ?? null,
    error: error ? { message: error.message, status: error.status } : null,
  }
}

export async function signInWithGoogle(redirectTo = getPostLoginRoute()) {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  })
}

export async function requestPasswordReset(
  email: string,
): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient()
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  return {
    error: error ? { message: error.message, status: error.status } : null,
  }
}

export async function updatePassword(
  password: string,
): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.updateUser({ password })

  return {
    error: error ? { message: error.message, status: error.status } : null,
  }
}

export async function signOutEverywhere(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut({ scope: 'global' })

  return {
    error: error ? { message: error.message, status: error.status } : null,
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error: error ? { message: error.message, status: error.status } : null }
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

// Returns only the JWT access token string — used by the axios interceptor
export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
