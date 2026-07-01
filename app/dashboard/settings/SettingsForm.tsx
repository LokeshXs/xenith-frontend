'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  updateUserPreferences,
  type UserPreferences,
} from '@/lib/services/preferences'
import type { ReplyCreditSummary } from '@/lib/services/billing'
import { isAxiosError } from 'axios'
import { CREATOR_PLAN_LIMITS } from '@/lib/plan-limits'

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

const USERNAME_REGEX = /^[A-Za-z0-9_]{1,15}$/

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

function formatCreditDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

type SettingsFormProps = {
  initialPreferences: UserPreferences
  // Full list of niche options to render — comes entirely from the API. When
  // empty we show an error in the Niche section rather than a hardcoded list.
  suggestedNiches: string[]
  replyCredits: ReplyCreditSummary | null
}

export function SettingsForm({
  initialPreferences,
  suggestedNiches,
  replyCredits,
}: SettingsFormProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences)
  // Baseline we diff against for the dirty state. Re-set after a successful
  // save so the dirty bar hides and the next edit is detected correctly.
  const [baseline, setBaseline] = useState<UserPreferences>(initialPreferences)
  const [draftAccount, setDraftAccount] = useState('')
  const [accountError, setAccountError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const maxNiches = CREATOR_PLAN_LIMITS.maxNiches
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

  const addAccount = () => {
    const normalized = draftAccount.trim().replace(/^@+/, '')
    if (!normalized) return
    if (prefs.inspirationAccounts.length >= maxInspirationAccounts) {
      setAccountError(`You can add up to ${maxInspirationAccounts} accounts.`)
      return
    }
    if (!USERNAME_REGEX.test(normalized)) {
      setAccountError('Use 1–15 letters, numbers, or underscores.')
      return
    }
    if (
      prefs.inspirationAccounts.some(
        (a) => a.toLowerCase() === normalized.toLowerCase(),
      )
    ) {
      setAccountError('Already added.')
      setDraftAccount('')
      return
    }
    setPrefs((p) => ({
      ...p,
      inspirationAccounts: [...p.inspirationAccounts, normalized],
    }))
    setDraftAccount('')
    setAccountError('')
  }

  const removeAccount = (name: string) => {
    setPrefs((p) => ({
      ...p,
      inspirationAccounts: p.inspirationAccounts.filter((a) => a !== name),
    }))
  }

  const handleSave = async () => {
    // Match the API's "min 1 non-blank" rule client-side so the user gets
    // immediate feedback without a round-trip.
    if (prefs.niche.filter((n) => n.trim()).length === 0) {
      setSaveError('Pick at least one niche.')
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
      // Pull the API's validation message ({ error: string }) on 400; the axios
      // interceptor already handles 401. 404 means the row was deleted between
      // load and save — rare, but surface a useful message rather than the
      // raw "Preferences not found."
      if (isAxiosError(err)) {
        const status = err.response?.status
        const apiMessage = err.response?.data?.error as string | undefined
        if (status === 404) {
          setSaveError('No saved preferences yet — finish onboarding first.')
        } else if (status === 400 && apiMessage) {
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
    setAccountError('')
    setSaveError('')
    setDraftAccount('')
  }

  const usedPercent = replyCredits?.period_granted
    ? Math.min(
        100,
        Math.max(0, (replyCredits.period_used / replyCredits.period_granted) * 100),
      )
    : 0
  const renewalDate = formatCreditDate(replyCredits?.period_ends_at ?? null)

  return (
    <div className="relative pb-28">
      <div className="divide-y divide-border ">
        <Section
          title="Reply credits"
          description="Current subscription period usage."
          
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
                    {renewalDate
                      ? `Renews ${renewalDate}`
                      : 'Renews with your next billing period'}
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
          description="The topics we'll source trends and ideas from."
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
          description="X accounts we'll learn voice and style from."
        >
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="@username"
                value={draftAccount}
                onChange={(e) => {
                  setDraftAccount(e.target.value)
                  if (accountError) setAccountError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAccount()
                  }
                }}
                aria-invalid={!!accountError}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addAccount}
                disabled={
                  !draftAccount.trim() ||
                  prefs.inspirationAccounts.length >= maxInspirationAccounts
                }
              >
                <IconPlus />
                Add
              </Button>
            </div>
            {accountError && (
              <p className="text-sm text-destructive">{accountError}</p>
            )}
            {!accountError && (
              <p className="text-xs text-muted-foreground">
                {prefs.inspirationAccounts.length} / {maxInspirationAccounts}{' '}
                added
              </p>
            )}
            {prefs.inspirationAccounts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prefs.inspirationAccounts.map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="gap-1 pl-2.5 pr-1"
                  >
                    @{name}
                    <button
                      type="button"
                      onClick={() => removeAccount(name)}
                      aria-label={`Remove @${name}`}
                      className="-mr-0.5 ml-0.5 inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <IconX className="size-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
