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
import { checkSignupEmailExists } from '@/lib/services/auth'
import { signUp } from '@/lib/supabase/auth-service'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { GoogleButton } from '../components/GoogleButton'
import { PasswordInput } from '../components/PasswordInput'

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ['confirmPassword'],
      })
    }
  })

type RegisterFields = z.infer<typeof registerSchema>
type FieldErrors = Partial<Record<keyof RegisterFields, string>>

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const redirectTo = getPostLoginRoute(searchParams.get('redirectTo'))
  useAuthGuard({ redirectIfAuthenticated: redirectTo })

  const [fields, setFields] = useState<RegisterFields>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = registerSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFields
        errors[field] = issue.message
      })
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const values = result.data
    let emailExists: boolean

    try {
      emailExists = await checkSignupEmailExists(values.email)
    } catch {
      setFormError('Could not verify this email right now. Please try again.')
      setIsSubmitting(false)
      return
    }

    if (emailExists) {
      setFieldErrors((prev) => ({
        ...prev,
        email: 'An account already exists with this email. Sign in instead.',
      }))
      setIsSubmitting(false)
      return
    }

    const { error, session } = await signUp(
      { name: values.name, email: values.email, password: values.password },
      redirectTo,
    )

    if (error) {
      setFormError(error.message)
      setIsSubmitting(false)
      return
    }

    if (session) {
      window.location.replace(redirectTo)
      return
    }

    setConfirmationSent(true)
    setIsSubmitting(false)
  }

  if (confirmationSent) {
    return (
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Confirm your account to continue with your selected subscription.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start generating your X posts today.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fields.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <FieldError>{fieldErrors.name}</FieldError>
          </Field>

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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={fields.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <FieldError>{fieldErrors.password}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              value={fields.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <FieldError>{fieldErrors.confirmPassword}</FieldError>
          </Field>

          {formError && <FieldError>{formError}</FieldError>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </FieldGroup>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-foreground hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
