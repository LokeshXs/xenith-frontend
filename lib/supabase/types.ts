import type { User, Session } from '@supabase/supabase-js'

export type { User, Session }

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends SignInCredentials {}
