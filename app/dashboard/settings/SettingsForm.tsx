'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconCalendar,
  IconCheck,
  IconCreditCard,
  IconLoader2,
} from '@tabler/icons-react'

import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InspirationAccountPicker } from '@/components/inspiration-account-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { cn } from '@/lib/utils'
import { CREATOR_PRICING } from '@/lib/pricing'
import {
  updateUserPreferences,
  type UserPreferences,
} from '@/lib/services/preferences'
import {
  changePlan,
  createBillingPortalSession,
  fetchBillingStatus,
  type BillingPlan,
  type BillingStatus,
  type BillingSubscriptionStatus,
} from '@/lib/services/billing'
import { isAxiosError } from 'axios'
import { CREATOR_PLAN_LIMITS } from '@/lib/plan-limits'
import { useAuth } from '@/context/AuthContext'

const POSTS_PER_DAY_OPTIONS = Array.from(
  { length: CREATOR_PLAN_LIMITS.maxPostsPerDay },
  (_, index) => {
    const count = index + 1
    return {
      value: String(count),
      label: `${count} post${count === 1 ? '' : 's'} / day`,
    }
  },
)

// Suggested replies generated per run — only 5 or 10 are supported.
const REPLY_COUNT_OPTIONS = [
  { value: '5', label: '5 replies' },
  { value: '10', label: '10 replies' },
] as const

const PLAN_DETAILS = {
  creator: {
    name: 'Creator Monthly',
    price: `$${CREATOR_PRICING.monthly} / month`,
    cadence: 'Billed monthly',
  },
  'creator-yearly': {
    name: 'Creator Yearly',
    price: `$${CREATOR_PRICING.yearly} / month`,
    cadence: 'Billed annually',
  },
} satisfies Record<BillingPlan, { name: string; price: string; cadence: string }>

function arrayEquals(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

type SectionProps = {
  title: string
  description: string
  children: React.ReactNode
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="grid gap-6 py-8 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

type ChipProps = {
  label: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

function Chip({ label, selected, onClick, disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-45',
        selected
          ? 'border-foreground bg-foreground text-background hover:bg-foreground/90'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      {selected && <IconCheck className="size-3.5" />}
      {label}
    </button>
  )
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function planName(plan: BillingPlan | null) {
  return plan ? PLAN_DETAILS[plan].name : 'Free'
}

function planPrice(plan: BillingPlan | null) {
  return plan ? PLAN_DETAILS[plan].price : '$0'
}

function planCadence(plan: BillingPlan | null) {
  return plan ? PLAN_DETAILS[plan].cadence : 'No active subscription'
}

function statusLabel(
  status: BillingSubscriptionStatus,
  hasAccess: boolean,
  cancelAtPeriodEnd: boolean,
) {
  // Ahead of the cancelled branch: a held subscription can also have a scheduled
  // cancellation, and "Cancelled" would hide the thing that actually needs fixing.
  if (status === 'on_hold') return 'On hold'
  if (cancelAtPeriodEnd && hasAccess) return 'Cancelled'
  if (status === 'free') return 'Free'
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function billingDateTileLabel(billing: BillingStatus) {
  if (billing.status === 'on_hold') return 'Access ends'
  if (billing.cancel_at_period_end) {
    return billing.is_trialing ? 'Trial cancelled' : 'Subscription cancelled'
  }
  if (billing.is_trialing) return 'Free trial'
  return 'Next billing'
}

function trialCountdownLabel(billing: BillingStatus) {
  if (!billing.is_trialing || billing.trial_days_remaining === null) return null
  const days = billing.trial_days_remaining
  return `Free trial ends in ${days} day${days === 1 ? '' : 's'}`
}

function periodLabel(billing: BillingStatus) {
  const trialEndDate = formatDate(billing.trial_ends_at)
  const endDate = formatDate(billing.access_expires_at ?? billing.next_billing_date)
  const renewalDate = formatDate(billing.next_billing_date ?? billing.access_expires_at)

  // First, above the trial branch: access_expires_at is the end of the grace
  // window here, and nothing else on this screen should claim the subscription is
  // renewing or that a trial is still running.
  if (billing.status === 'on_hold') {
    return endDate
      ? `Payment failed — access ends on ${endDate}`
      : 'Payment failed — access ends soon'
  }

  if (billing.is_trialing) {
    if (billing.cancel_at_period_end) {
      return trialEndDate ? `Trial access ends on ${trialEndDate}` : 'Trial access ends soon'
    }
    return trialEndDate ? `Trial ends on ${trialEndDate}` : 'Trial ends soon'
  }

  if (billing.cancel_at_period_end) {
    return endDate ? `Ends on ${endDate}` : 'Ends at the end of your billing period'
  }

  if (billing.has_access) {
    return renewalDate
      ? `Renews on ${renewalDate}`
      : 'Renews with your next billing period'
  }

  if (billing.status === 'expired' || billing.status === 'cancelled') {
    return endDate ? `Ended on ${endDate}` : 'Subscription ended'
  }

  return 'No renewal scheduled'
}

type SettingsFormProps = {
  initialPreferences: UserPreferences
  // Full list of niche options to render — comes entirely from the API. When
  // empty we show an error in the Niche section rather than a hardcoded list.
  suggestedNiches: string[]
  billingStatus: BillingStatus | null
}

export function SettingsForm({
  initialPreferences,
  suggestedNiches,
  billingStatus,
}: SettingsFormProps) {
  const { session } = useAuth()
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences)
  const [billing, setBilling] = useState<BillingStatus | null>(billingStatus)
  // Baseline we diff against for the dirty state. Re-set after a successful
  // save so the dirty bar hides and the next edit is detected correctly.
  const [baseline, setBaseline] = useState<UserPreferences>(initialPreferences)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false)
  const [billingPortalError, setBillingPortalError] = useState('')
  const [switchingPlan, setSwitchingPlan] = useState(false)
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [switchError, setSwitchError] = useState('')
  const minNiches = CREATOR_PLAN_LIMITS.minNiches
  const maxNiches = CREATOR_PLAN_LIMITS.maxNiches
  const minInspirationAccounts = CREATOR_PLAN_LIMITS.minInspirationAccounts
  const maxInspirationAccounts = CREATOR_PLAN_LIMITS.maxInspirationAccounts
  const maxPostsPerDay = CREATOR_PLAN_LIMITS.maxPostsPerDay

  // Auto-dismiss the "Preferences saved" toast 2.5s after a successful save.
  useEffect(() => {
    if (savedAt === null) return
    const id = setTimeout(() => setSavedAt(null), 2500)
    return () => clearTimeout(id)
  }, [savedAt])

  const isDirty = useMemo(() => {
    return (
      !arrayEquals(prefs.niche, baseline.niche) ||
      !arrayEquals(prefs.inspirationAccounts, baseline.inspirationAccounts) ||
      prefs.postsPerDay !== baseline.postsPerDay ||
      prefs.replyCount !== baseline.replyCount ||
      prefs.deliveryTime !== baseline.deliveryTime
    )
  }, [prefs, baseline])

  const toggle = (key: 'niche', value: string) => {
    setPrefs((p) => {
      const list = p[key]
      if (!list.includes(value) && list.length >= maxNiches) return p

      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
      return { ...p, [key]: next }
    })
  }

  const handleSave = async () => {
    // Match the API's minimum rule client-side so the user gets
    // immediate feedback without a round-trip.
    if (prefs.niche.filter((n) => n.trim()).length < minNiches) {
      setSaveError(`Pick at least ${minNiches} niches.`)
      return
    }
    if (prefs.niche.length > maxNiches) {
      setSaveError(`Select up to ${maxNiches} niches.`)
      return
    }
    if (prefs.inspirationAccounts.length > maxInspirationAccounts) {
      setSaveError(`Add up to ${maxInspirationAccounts} inspiration accounts.`)
      return
    }
    if (
      prefs.inspirationAccounts.filter((account) => account.trim()).length <
      minInspirationAccounts
    ) {
      setSaveError(
        `Add at least ${minInspirationAccounts} inspiration accounts.`,
      )
      return
    }
    const postsPerDay = Number(prefs.postsPerDay)
    if (
      !Number.isInteger(postsPerDay) ||
      postsPerDay < 1 ||
      postsPerDay > maxPostsPerDay
    ) {
      setSaveError(`Choose between 1 and ${maxPostsPerDay} posts per day.`)
      return
    }
    if (prefs.replyCount !== '5' && prefs.replyCount !== '10') {
      setSaveError('Choose either 5 or 10 suggested replies.')
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      const updated = await updateUserPreferences(prefs)
      // Use the server's authoritative response as the new baseline so the
      // form re-syncs if the API normalized anything (e.g. trimmed entries).
      const next: UserPreferences = {
        niche: updated.niche,
        inspirationAccounts: updated.inspirationAccounts,
        postsPerDay: updated.postsPerDay,
        replyCount: updated.replyCount,
        deliveryTime: updated.deliveryTime,
      }
      setPrefs(next)
      setBaseline(next)
      setSavedAt(Date.now())
    } catch (err) {
      // Pull the API's actionable validation/verification message. The axios
      // interceptor already handles 401. 404 means the row was deleted between
      // load and save — rare, but surface a useful message rather than the raw
      // "Preferences not found."
      if (isAxiosError(err)) {
        const status = err.response?.status
        const apiMessage = err.response?.data?.error as string | undefined
        if (status === 404) {
          setSaveError('No saved preferences yet — finish onboarding first.')
        } else if (apiMessage && [400, 409, 422, 429, 503].includes(status ?? 0)) {
          setSaveError(apiMessage)
        } else {
          setSaveError("Couldn't save your preferences. Please try again.")
        }
      } else {
        setSaveError("Couldn't save your preferences. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPrefs(baseline)
    setSaveError('')
  }

  const handleOpenBillingPortal = async () => {
    const accessToken = session?.access_token
    if (!accessToken) {
      setBillingPortalError('Your session expired. Please sign in again.')
      return
    }

    setOpeningBillingPortal(true)
    setBillingPortalError('')
    const result = await createBillingPortalSession(accessToken)

    if (result.kind === 'ok') {
      window.location.assign(result.portalUrl)
      return
    }

    setOpeningBillingPortal(false)

    if (result.kind === 'unauthorized') {
      window.location.assign('/login')
      return
    }

    setBillingPortalError(result.message)
  }

  const targetPlan: BillingPlan | null =
    billing?.plan === 'creator'
      ? 'creator-yearly'
      : billing?.plan === 'creator-yearly'
        ? 'creator'
        : null
  // Mirrors the backend gate so the button never opens a guaranteed-409 flow.
  // Trial users are excluded: Dodo's immediate proration would end the trial
  // and charge the full new-plan price right away.
  const canSwitchPlan = Boolean(
    billing &&
      targetPlan &&
      billing.has_access &&
      billing.status === 'active' &&
      !billing.is_trialing,
  )
  const targetPlanDetails = targetPlan ? PLAN_DETAILS[targetPlan] : null
  const targetRenewalLabel =
    targetPlan === 'creator-yearly'
      ? `$${CREATOR_PRICING.yearly * 12}/year`
      : `$${CREATOR_PRICING.monthly}/month`

  const refreshBillingStatus = async () => {
    const accessToken = session?.access_token
    if (!accessToken) return
    const result = await fetchBillingStatus(accessToken)
    if (result.kind === 'ok') setBilling(result.data)
  }

  const handleSwitchPlan = async () => {
    const accessToken = session?.access_token
    if (!accessToken || !targetPlan) {
      setSwitchError('Your session expired. Please sign in again.')
      return
    }

    setSwitchingPlan(true)
    setSwitchError('')
    const result = await changePlan(accessToken, targetPlan)
    setSwitchingPlan(false)

    if (result.kind === 'ok') {
      setBilling(result.data)
      setSwitchDialogOpen(false)
      toast.success('Plan updated', {
        description: `You are now on ${planName(result.data.plan ?? targetPlan)}.`,
      })
      return
    }

    if (result.kind === 'unauthorized') {
      window.location.assign('/login')
      return
    }

    setSwitchError(result.message)
    // The change may have succeeded at Dodo even if the local sync failed —
    // refetch so the UI self-heals once the webhook reconciles.
    void refreshBillingStatus()
  }

  const replyCredits = billing?.reply_credits ?? null
  const usedPercent = replyCredits?.period_granted
    ? Math.min(
        100,
        Math.max(0, (replyCredits.period_used / replyCredits.period_granted) * 100),
      )
    : 0
  const renewalDate = formatDate(replyCredits?.period_ends_at ?? null)
  const trialLabel = billing ? trialCountdownLabel(billing) : null

  return (
    <div className="relative pb-28">
      <div className="divide-y divide-border ">
        <Section
          title="Reply credits"
          description="This month's usage. Credits refresh monthly on every plan."
          
        >
          {replyCredits ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between  ">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {replyCredits.balance}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Used</span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {replyCredits.period_used}
                  </span>
                </div>
             
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width]"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span className="tabular-nums text-primary">
                    {replyCredits.period_used} used of {replyCredits.period_granted}
                  </span>
                  <span>
                    {renewalDate ? `Renews ${renewalDate}` : 'Renews monthly'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  1 reply cost {replyCredits.credits_per_reply} Credits
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Reply credit usage is unavailable right now.
            </p>
          )}
        </Section>

        <Section
          title="Niche"
          description={`Choose ${minNiches} to ${maxNiches} topics we'll source trends and ideas from.`}
        >
          {suggestedNiches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedNiches.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  selected={prefs.niche.includes(topic)}
                  onClick={() => toggle('niche', topic)}
                  disabled={
                    !prefs.niche.includes(topic) &&
                    prefs.niche.length >= maxNiches
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-destructive">
              We couldn&rsquo;t load niche options. Please refresh the page or try
              again later.
            </p>
          )}
        </Section>

        <Section
          title="Inspiration"
          description={`Search for and select ${minInspirationAccounts} to ${maxInspirationAccounts} public X accounts we'll learn voice and style from.`}
        >
          <div className="flex flex-col gap-3">
            <InspirationAccountPicker
              accounts={prefs.inspirationAccounts}
              maxAccounts={maxInspirationAccounts}
              onChange={(inspirationAccounts) =>
                setPrefs((current) => ({ ...current, inspirationAccounts }))
              }
            />
            <p className="text-xs text-muted-foreground">
              {prefs.inspirationAccounts.length} / {maxInspirationAccounts} selected
              {prefs.inspirationAccounts.length < minInspirationAccounts
                ? `. Select at least ${minInspirationAccounts} to save.`
                : ''}
            </p>
          </div>
        </Section>

        <Section
          title="Delivery"
          description="How many drafts you get, and when."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="posts-per-day">Posts per day</Label>
              <Select
                value={prefs.postsPerDay}
                onValueChange={(v) => {
                  if (typeof v !== 'string') return
                  setPrefs((p) => ({ ...p, postsPerDay: v }))
                }}
              >
                <SelectTrigger id="posts-per-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSTS_PER_DAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="delivery-time">Delivery time</Label>
              <TimePicker
                id="delivery-time"
                value={prefs.deliveryTime}
                onChange={(value) =>
                  setPrefs((p) => ({ ...p, deliveryTime: value }))
                }
              />
            </div>
          </div>
        </Section>

        <Section
          title="Suggested replies"
          description="How many reply suggestions we generate each run."
        >
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="reply-count">Replies per run</Label>
            <Select
              value={prefs.replyCount}
              onValueChange={(v) => {
                if (typeof v !== 'string') return
                setPrefs((p) => ({ ...p, replyCount: v }))
              }}
            >
              <SelectTrigger id="reply-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPLY_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section
          title="Plan details"
          description="Your subscription, renewal, and cancellation status."
        >
          {billing ? (
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-background p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {planName(billing.plan)}
                    </h3>
                    <Badge
                      variant={
                        // has_access is true throughout the grace window, so it
                        // alone would render a failed payment as a normal badge.
                        billing.status === 'on_hold'
                          ? 'destructive'
                          : billing.has_access
                            ? 'default'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {statusLabel(
                        billing.status,
                        billing.has_access,
                        billing.cancel_at_period_end,
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {planCadence(billing.plan)}
                  </p>
                  {trialLabel && (
                    <p className="text-sm font-medium text-foreground">
                      {trialLabel}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-left sm:text-right">
                  <span className="text-2xl font-semibold tabular-nums">
                    {planPrice(billing.plan)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {periodLabel(billing)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg bg-muted/45 p-3">
                  <IconCalendar className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {billingDateTileLabel(billing)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {periodLabel(billing)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-muted/45 p-3">
                  <IconCreditCard className="mt-0.5 size-10 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Billing details</span>
                    <span className="text-sm text-muted-foreground">
                      Payment method and invoices are managed by Dodo Payments.
                    </span>
                  </div>
                </div>
              </div>

              {billing.cancel_at_period_end && (
                <p className="rounded-lg border border-border bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
                  {billing.is_trialing
                    ? "Your trial is cancelled. You won't be charged. You can keep using Xenith until your trial access ends."
                    : "Your subscription is cancelled. You won't be charged again. You can keep using Xenith until your access ends."}
                </p>
              )}

              {billing.plan !== null && (
                <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                      View invoices, update your payment method, or manage your
                      subscription securely with Dodo Payments.
                    </p>
                    {billingPortalError && (
                      <p className="text-sm text-destructive">
                        {billingPortalError}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {canSwitchPlan && targetPlanDetails && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSwitchError('')
                          setSwitchDialogOpen(true)
                        }}
                        className="sm:w-fit"
                      >
                        Switch to {targetPlanDetails.name}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleOpenBillingPortal()}
                      disabled={openingBillingPortal}
                      className="sm:w-fit"
                    >
                      {openingBillingPortal && (
                        <IconLoader2
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                      )}
                      {openingBillingPortal
                        ? 'Opening billing…'
                        : 'Manage billing & invoices'}
                    </Button>
                  </div>
                </div>
              )}

              <AlertDialog
                open={switchDialogOpen}
                onOpenChange={(open) => {
                  if (!switchingPlan) setSwitchDialogOpen(open)
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Switch to {targetPlanDetails?.name}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Your plan changes immediately. Dodo Payments will charge
                      or credit the prorated difference for the remainder of
                      your current billing period, and your renewal moves to{' '}
                      {targetRenewalLabel}.
                      {billing.cancel_at_period_end &&
                        ' This also resumes your subscription — it will no longer cancel at the period end.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {switchError && (
                    <p className="text-sm text-destructive">{switchError}</p>
                  )}
                  <AlertDialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={switchingPlan}
                      onClick={() => setSwitchDialogOpen(false)}
                    >
                      Keep current plan
                    </Button>
                    <Button
                      type="button"
                      disabled={switchingPlan}
                      onClick={() => void handleSwitchPlan()}
                    >
                      {switchingPlan && (
                        <IconLoader2
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                      )}
                      {switchingPlan
                        ? 'Switching…'
                        : `Switch to ${targetPlanDetails?.name}`}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Plan details are unavailable right now.
            </p>
          )}
        </Section>
      </div>

      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out',
          isDirty
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0',
        )}
        aria-hidden={!isDirty}
      >
        <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-full sm:py-2">
          <p
            className={cn(
              'text-center text-sm sm:text-left',
              saveError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {saveError || 'You have unsaved changes.'}
          </p>
          <div className="flex items-center gap-2 max-sm:w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="max-sm:flex-1"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="max-sm:flex-1"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>

      {savedAt && !isDirty && (
        <div
          key={savedAt}
          className="fixed inset-x-0 bottom-6 z-20 mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-background/90 px-3.5 py-1.5 text-sm text-muted-foreground shadow-md backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        >
          <IconCheck className="size-4 text-foreground" />
          Preferences saved
        </div>
      )}

    </div>
  )
}
