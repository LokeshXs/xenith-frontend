'use client'

import { useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { PasswordInput } from '../components/PasswordInput'
import { signOutEverywhere, updatePassword } from '@/lib/supabase/auth-service'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ['confirmPassword'],
      })
    }
  })

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>
type FieldErrors = Partial<Record<keyof ResetPasswordFields, string>>

export function ResetPasswordForm() {
  const [fields, setFields] = useState<ResetPasswordFields>({
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setFields((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
    setFormError(null)
  }

  async function completeSignOut() {
    setIsSubmitting(true)
    setFormError(null)

    const { error } = await signOutEverywhere()

    if (error) {
      setFormError(
        'Your password was updated, but we could not sign you out everywhere. Try again.',
      )
      setIsSubmitting(false)
      return
    }

    window.location.replace('/login?passwordReset=success')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (isPasswordUpdated) {
      await completeSignOut()
      return
    }

    const result = resetPasswordSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ResetPasswordFields
        errors[field] = issue.message
      })
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const { error } = await updatePassword(result.data.password)

    if (error) {
      setFormError('We could not update your password. Request a new reset link and try again.')
      setIsSubmitting(false)
      return
    }

    setIsPasswordUpdated(true)
    await completeSignOut()
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a password with at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup className="gap-5">
          <Field
            data-invalid={Boolean(fieldErrors.password)}
            data-disabled={isPasswordUpdated || isSubmitting}
          >
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={fields.password}
              onChange={handleChange}
              disabled={isPasswordUpdated || isSubmitting}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            <FieldError>{fieldErrors.password}</FieldError>
          </Field>

          <Field
            data-invalid={Boolean(fieldErrors.confirmPassword)}
            data-disabled={isPasswordUpdated || isSubmitting}
          >
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              value={fields.confirmPassword}
              onChange={handleChange}
              disabled={isPasswordUpdated || isSubmitting}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            <FieldError>{fieldErrors.confirmPassword}</FieldError>
          </Field>

          {formError && <FieldError>{formError}</FieldError>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? isPasswordUpdated
                ? 'Signing out everywhere…'
                : 'Updating password…'
              : isPasswordUpdated
                ? 'Retry signing out'
                : 'Update password'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
