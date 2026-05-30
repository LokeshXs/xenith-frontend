import { getSupabaseBrowserClient } from './client'
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

export async function signUp(credentials: SignUpCredentials): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp(credentials)
  return {
    user: data.user,
    session: data.session ?? null,
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
