'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { getPostLoginRoute } from '@/lib/auth/post-login-route'
import { requestPasswordReset } from '@/lib/supabase/auth-service'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPasswordClient() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  )
}

function ForgotPasswordForm() {
  useAuthGuard({ redirectIfAuthenticated: getPostLoginRoute() })

  const searchParams = useSearchParams()
  const hasInvalidLink = searchParams.get('error') === 'invalid-link'

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(
    hasInvalidLink
      ? 'This password reset link is invalid or has expired. Request a new one.'
      : null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value)
    setEmailError(null)
    setFormError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const { error } = await requestPasswordReset(result.data.email)

    if (error) {
      setFormError(
        error.status === 429
          ? 'Too many reset attempts. Please wait a few minutes and try again.'
          : 'We could not send the reset email. Please try again.',
      )
      setIsSubmitting(false)
      return
    }

    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  if (isSubmitted) {
    return (
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for that email, we sent a link to reset its password.
          Check your spam folder if it does not arrive shortly.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          The email may appear in your inbox as being sent by Supabase.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={() => setIsSubmitted(false)}
        >
          Send another email
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground hover:text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field data-invalid={Boolean(emailError)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(emailError)}
            />
            <FieldError>{emailError}</FieldError>
          </Field>

          {formError && <FieldError>{formError}</FieldError>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending reset link…' : 'Send reset link'}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-foreground hover:text-primary">
          Sign in
        </Link>
      </p>
    </div>
  )
}
