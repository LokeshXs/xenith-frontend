'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { getPostLoginRoute } from '@/lib/auth/post-login-route'
import { recordPostLogin } from '@/lib/services/auth'
import { signIn } from '@/lib/supabase/auth-service'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { GoogleButton } from '../components/GoogleButton'
import { PasswordInput } from '../components/PasswordInput'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFields = z.infer<typeof loginSchema>
type FieldErrors = Partial<Record<keyof LoginFields, string>>

export default function LoginClient() {
  // useSearchParams() (read inside LoginForm) opts the route into client-side
  // rendering, so Next requires a Suspense boundary around it for the build.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const requestedRedirect = searchParams.get('redirectTo')
  const redirectTo = getPostLoginRoute(requestedRedirect)
  const wasPasswordReset = searchParams.get('passwordReset') === 'success'
  useAuthGuard({ redirectIfAuthenticated: redirectTo })

  const [fields, setFields] = useState<LoginFields>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = loginSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFields
        errors[field] = issue.message
      })
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const { error, session } = await signIn(fields)

    if (error) {
      setFormError(error.message)
      setIsSubmitting(false)
      return
    }

    if (!session) {
      setFormError('Sign-in completed without creating a session. Please try again.')
      setIsSubmitting(false)
      return
    }

    try {
      await recordPostLogin(session.access_token)
    } catch (error) {
      console.warn(
        '[auth] post-login event failed',
        error instanceof Error ? error.message : error,
      )
    }

    // Use a document navigation so the first protected request is guaranteed
    // to include the session cookie written by the Supabase browser client.
    window.location.replace(redirectTo)
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back! Please enter your details.
        </p>
        {wasPasswordReset && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            Your password was updated. Sign in with your new password.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={fields.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-4">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={fields.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <FieldError>{fieldErrors.password}</FieldError>
          </Field>

          {formError && <FieldError>{formError}</FieldError>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </FieldGroup>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton redirectTo={redirectTo} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-foreground hover:text-primary"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
