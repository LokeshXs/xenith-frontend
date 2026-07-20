'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import {
  IconRosetteDiscountCheck,
  IconSparkles,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { getErrorMessage } from '@/app/onboarding/utils/getErrorMessage'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createTrialRequest } from '@/lib/services/trial-requests-client'

export const CREATOR_TRIAL_POPUP_OPEN_EVENT = 'xenith:open-creator-trial-popup'

const DISMISSED_KEY = 'xenith_creator_trial_popup_dismissed_at'
const SUBMITTED_KEY = 'xenith_creator_trial_popup_submitted'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000
const OPEN_DELAY_MS = 1800
const NAME_MAX_LENGTH = 120
const EMAIL_MAX_LENGTH = 320
const URL_MAX_LENGTH = 2000
const MESSAGE_MAX_LENGTH = 2000
const MIN_FOLLOWER_COUNT = 1_000
const MAX_FOLLOWER_COUNT = 1_000_000_000
const X_HOSTNAMES = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'])

type TrialRequestFields = {
  name: string
  email: string
  xProfileUrl: string
  followerCount: string
  isVerified: boolean
  message: string
  website: string
}

type FieldErrors = Partial<Record<keyof TrialRequestFields, string>>

const EMPTY_FIELDS: TrialRequestFields = {
  name: '',
  email: '',
  xProfileUrl: '',
  followerCount: '',
  isVerified: false,
  message: '',
  website: '',
}

function normalizeFollowerCount(value: string): string {
  return value.replace(/,/g, '').trim()
}

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private browsing; the form still works.
  }
}

function shouldAutoOpen(): boolean {
  if (readLocalStorage(SUBMITTED_KEY) === 'true') return false

  const dismissedAt = Number(readLocalStorage(DISMISSED_KEY))
  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) return true

  return Date.now() - dismissedAt >= DISMISS_DURATION_MS
}

const trialRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name')
    .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or fewer`),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(EMAIL_MAX_LENGTH, `Email must be ${EMAIL_MAX_LENGTH} characters or fewer`),
  xProfileUrl: z
    .string()
    .trim()
    .url('Enter a valid X profile URL')
    .max(URL_MAX_LENGTH, `X profile URL must be ${URL_MAX_LENGTH} characters or fewer`)
    .superRefine((value, ctx) => {
      try {
        const hostname = new URL(value).hostname.toLowerCase()
        if (!X_HOSTNAMES.has(hostname)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Enter an x.com or twitter.com profile URL',
          })
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid X profile URL',
        })
      }
    }),
  followerCount: z
    .string()
    .trim()
    .min(1, 'Enter your follower count')
    .superRefine((value, ctx) => {
      const normalized = normalizeFollowerCount(value)
      if (!/^\d+$/.test(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Follower count must be a whole number',
        })
        return
      }

      const count = Number(normalized)
      if (count > MAX_FOLLOWER_COUNT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Follower count must be ${MAX_FOLLOWER_COUNT.toLocaleString()} or fewer`,
        })
      }
      if (count < MIN_FOLLOWER_COUNT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'This offer is for creators with 1k+ followers.',
        })
      }
    }),
  isVerified: z.literal(true, {
    error: 'Confirm that your X account is verified.',
  }),
  message: z
    .string()
    .trim()
    .max(MESSAGE_MAX_LENGTH, `Message must be ${MESSAGE_MAX_LENGTH.toLocaleString()} characters or fewer`),
})

function fieldErrorsFromIssues(issues: z.ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const field = issue.path[0] as keyof TrialRequestFields
    errors[field] ??= issue.message
  }
  return errors
}

export function CreatorTrialPopup() {
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<TrialRequestFields>(EMPTY_FIELDS)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!shouldAutoOpen()) return
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    function handleManualOpen() {
      setOpen(true)
    }

    window.addEventListener(CREATOR_TRIAL_POPUP_OPEN_EVENT, handleManualOpen)
    return () => {
      window.removeEventListener(CREATOR_TRIAL_POPUP_OPEN_EVENT, handleManualOpen)
    }
  }, [])

  function resetForm() {
    setFields(EMPTY_FIELDS)
    setFieldErrors({})
    setFormError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return
    if (!nextOpen && open) {
      writeLocalStorage(DISMISSED_KEY, Date.now().toString())
    }
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    const field = name as keyof TrialRequestFields
    setFields((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(null)
  }

  function handleVerifiedChange(event: ChangeEvent<HTMLInputElement>) {
    setFields((current) => ({ ...current, isVerified: event.target.checked }))
    setFieldErrors((current) => ({ ...current, isVerified: undefined }))
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const result = trialRequestSchema.safeParse(fields)
    if (!result.success) {
      setFieldErrors(fieldErrorsFromIssues(result.error.issues))
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    try {
      await createTrialRequest({
        name: result.data.name,
        email: result.data.email,
        platform: 'x',
        socialProfileUrl: result.data.xProfileUrl,
        followerCount: Number(normalizeFollowerCount(result.data.followerCount)),
        isVerified: result.data.isVerified,
        ...(result.data.message ? { message: result.data.message } : {}),
        website: fields.website,
      })

      writeLocalStorage(SUBMITTED_KEY, 'true')
      resetForm()
      setOpen(false)
      toast.success('Request submitted', {
        description: "We'll review your X profile and email you if approved.",
      })
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined
      setFormError(
        status === 400
          ? getErrorMessage(error, 'Check your details and try again.')
          : status === 429
            ? 'Too many requests. Please try again later.'
          : 'Could not submit your request. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[34rem] overflow-y-auto rounded-3xl border-border/80 p-0 shadow-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor="trial-website">Website</label>
            <input
              id="trial-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={fields.website}
              onChange={handleChange}
            />
          </div>

          <div className="relative border-b border-border/70 px-5 pt-5 pb-4 sm:px-6">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-4 right-4 rounded-xl"
                  aria-label="Close creator trial request"
                  disabled={isSubmitting}
                />
              }
            >
              <IconX className="size-4" />
            </DialogClose>

            <div className="flex items-start gap-3 pr-10">
            

              <DialogHeader className="gap-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Creator trial
                  </span>
                </div>
                <DialogTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Request your 3-day Xenith trial
                </DialogTitle>
                <DialogDescription className="max-w-md text-sm leading-relaxed">
                  For verified X creators with 1k+ followers. We review each request
                  manually.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium">
                <IconUsers className="size-3.5 text-primary" />
                1k+ followers
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                <IconRosetteDiscountCheck className="size-3.5" />
                Verified X account
              </span>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(fieldErrors.name)}>
                  <FieldLabel htmlFor="trial-name">Name</FieldLabel>
                  <Input
                    id="trial-name"
                    name="name"
                    placeholder="Your name"
                    value={fields.name}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.name)}
                    maxLength={NAME_MAX_LENGTH}
                    autoComplete="name"
                    disabled={isSubmitting}
                  />
                  <FieldError>{fieldErrors.name}</FieldError>
                </Field>

                <Field data-invalid={Boolean(fieldErrors.email)}>
                  <FieldLabel htmlFor="trial-email">Email</FieldLabel>
                  <Input
                    id="trial-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={fields.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.email)}
                    maxLength={EMAIL_MAX_LENGTH}
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                  <FieldError>{fieldErrors.email}</FieldError>
                </Field>
              </div>

              <Field data-invalid={Boolean(fieldErrors.xProfileUrl)}>
                <FieldLabel htmlFor="trial-x-profile">X profile URL</FieldLabel>
                <Input
                  id="trial-x-profile"
                  name="xProfileUrl"
                  type="url"
                  placeholder="https://x.com/yourhandle"
                  value={fields.xProfileUrl}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.xProfileUrl)}
                  maxLength={URL_MAX_LENGTH}
                  autoComplete="url"
                  disabled={isSubmitting}
                />
                <FieldError>{fieldErrors.xProfileUrl}</FieldError>
              </Field>

              <Field data-invalid={Boolean(fieldErrors.followerCount)}>
                <FieldLabel htmlFor="trial-follower-count">Follower count</FieldLabel>
                <Input
                  id="trial-follower-count"
                  name="followerCount"
                  inputMode="numeric"
                  placeholder="12000"
                  value={fields.followerCount}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.followerCount)}
                  disabled={isSubmitting}
                />
                <FieldError>{fieldErrors.followerCount}</FieldError>
              </Field>

              <Field data-invalid={Boolean(fieldErrors.isVerified)} className="gap-2">
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60">
                  <input
                    name="isVerified"
                    type="checkbox"
                    checked={fields.isVerified}
                    onChange={handleVerifiedChange}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.isVerified)}
                    className="mt-0.5 size-4 rounded border-border accent-primary"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      My X account is verified
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      We check this manually before sending trial access.
                    </span>
                  </span>
                </label>
                <FieldError>{fieldErrors.isVerified}</FieldError>
              </Field>

              <Field data-invalid={Boolean(fieldErrors.message)}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="trial-message">Message</FieldLabel>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Textarea
                  id="trial-message"
                  name="message"
                  placeholder="Anything we should know?"
                  value={fields.message}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.message)}
                  maxLength={MESSAGE_MAX_LENGTH}
                  className="min-h-24"
                  disabled={isSubmitting}
                />
                <div className="flex items-start justify-between gap-3">
                  <FieldError>{fieldErrors.message}</FieldError>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {fields.message.length}/{MESSAGE_MAX_LENGTH.toLocaleString()}
                  </span>
                </div>
              </Field>

              {formError && <FieldError>{formError}</FieldError>}
            </FieldGroup>

            <DialogFooter className="mt-6 flex-col gap-3 sm:flex-col sm:items-stretch">
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Request creator trial'}
                <IconSparkles data-icon="inline-end" />
              </Button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Manual review only. If approved, we&apos;ll email your trial access.
              </p>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
