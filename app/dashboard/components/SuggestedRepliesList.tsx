'use client'

import Link from 'next/link'
import {
  IconArrowRight,
  IconClock,
  IconLoader2,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/app/onboarding/utils/getErrorMessage'
import type {
  ReplyGenerationLimitSummary,
  SuggestedReply,
  SuggestedRepliesHistoryResponse,
} from '@/lib/services/suggested-replies'
import {
  fetchSuggestedRepliesHistory,
  generateSuggestedReplies,
} from '@/lib/services/suggested-replies-client'
import { patchReplyInHistory } from '@/lib/services/suggested-replies-cache'
import { formatDayLabel, todayKeyInTimezone } from '@/lib/utils/day-label'
import { SuggestedReplyCard } from './SuggestedReplyCard'

// Page 1 of the day-grouped history. The main view shows only the newest day.
const LATEST_QUERY_KEY = ['suggested-replies', 'history', 1] as const
const REPLY_GENERATION_TIP =
  'Tip: Keep about a 5-hour gap between reply generations. Growth on X compounds when you show up consistently, not all at once.'

function limitFromError(err: unknown): ReplyGenerationLimitSummary | null {
  if (typeof err !== 'object' || err === null) return null
  const maybe = err as {
    response?: { data?: { reply_generation_limit?: ReplyGenerationLimitSummary } }
  }
  return maybe.response?.data?.reply_generation_limit ?? null
}

export function SuggestedRepliesList() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: LATEST_QUERY_KEY,
    queryFn: () => fetchSuggestedRepliesHistory(1),
  })

  // Show only the latest date batch; older days live on the "Show all" page.
  const latest = data?.groups[0]
  // Only surface the latest batch if it was generated today (in the user's tz);
  // an older batch falls through to the empty/generate state below.
  const isLatestToday =
    !!latest && !!data && latest.date === todayKeyInTimezone(data.timezone)
  const replies = isLatestToday ? (latest?.replies ?? []) : []
  const xAccount = data?.xAccount ?? null

  const handleUpdated = (updated: SuggestedReply) => {
    queryClient.setQueryData(LATEST_QUERY_KEY, (prev: typeof data) =>
      patchReplyInHistory(prev, updated),
    )
  }

  // Refresh regenerates a fresh batch (slow: AI + X API). On success we write the
  // new batch into the history cache as today's group, so the view — which reads
  // from the query — and edit patching stay on one source of truth.
  const generate = useMutation({
    mutationFn: () => generateSuggestedReplies(),
    onSuccess: (res) => {
      const todayKey = todayKeyInTimezone(res.timezone)
      queryClient.setQueryData(
        LATEST_QUERY_KEY,
        (prev: SuggestedRepliesHistoryResponse | undefined) => {
          const rest = prev?.groups.filter((g) => g.date !== todayKey) ?? []
          return {
            timezone: res.timezone,
            xAccount: res.xAccount,
            groups: [{ date: todayKey, replies: res.replies }, ...rest],
            reply_generation_limit: res.reply_generation_limit,
            pagination: prev?.pagination ?? {
              page: 1,
              limit: 7,
              totalDays: rest.length + 1,
              hasMore: false,
            },
          }
        },
      )
    },
    onError: (err) => {
      const nextLimit = limitFromError(err)
      if (!nextLimit) return
      queryClient.setQueryData(
        LATEST_QUERY_KEY,
        (prev: SuggestedRepliesHistoryResponse | undefined) =>
          prev ? { ...prev, reply_generation_limit: nextLimit } : prev,
      )
    },
  })

  const effectiveReplyGenerationLimit =
    limitFromError(generate.error) ?? data?.reply_generation_limit ?? null
  const isDailyLimitReached =
    effectiveReplyGenerationLimit?.limited === true &&
    effectiveReplyGenerationLimit.remaining_today === 0
  const trialUsageLabel =
    effectiveReplyGenerationLimit?.limited === true &&
    effectiveReplyGenerationLimit.limit !== null
      ? `Trial limit: ${effectiveReplyGenerationLimit.active_today} of ${effectiveReplyGenerationLimit.limit} sessions used today.`
      : null

  // The dashed empty state owns its own Generate button, so the header Refresh
  // is hidden there to avoid two competing triggers.
  const isEmpty =
    !generate.isPending && !generate.isError && !(latest && replies.length > 0)

  const refreshButton = (
    <Button
      size="sm"
      variant="outline"
      onClick={() => generate.mutate()}
      disabled={generate.isPending || isDailyLimitReached}
      className="self-start sm:self-auto"
    >
      {generate.isPending ? (
        <>
          <IconLoader2 className="size-4 animate-spin" />
          Generating…
        </>
      ) : isDailyLimitReached ? (
        'Daily limit reached'
      ) : (
        <>
          <IconRefresh className="size-4" />
          Refresh
        </>
      )}
    </Button>
  )

  const showAllButton = (
    <Link
      href="/dashboard/suggested-replies/all"
      className={buttonVariants({
        variant: 'ghost',
        size: 'sm',
        className: 'self-start sm:self-auto',
      })}
    >
      Show all
      <IconArrowRight className="size-4" />
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl max-sm:text-xl font-semibold tracking-tight">
            Suggested Replies
          </h1>
        </header>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-destructive">
          {getErrorMessage(
            error,
            'Something went wrong loading your suggested replies. Please try again.',
          )}
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <IconRefresh className="size-4" />
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="text-2xl max-sm:text-xl font-semibold tracking-tight">
            Suggested Replies
          </h1>
          {replies.length > 0 && (
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            {showAllButton}
            {!isEmpty && refreshButton}
          </div>
          {trialUsageLabel && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 tabular-nums dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {trialUsageLabel}
            </p>
          )}
        </div>
      </header>

      <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <IconClock className="mt-0.5 size-4 shrink-0" />
        <p>{REPLY_GENERATION_TIP}</p>
      </div>

      {generate.isPending ? (
        // Regeneration is slow — replace the replies with skeletons meanwhile.
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : generate.isError ? (
        // A failed regeneration replaces the replies with the server's message
        // (402 upgrade prompt / 4xx pipeline error / generic) plus a retry.
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-destructive">
            {getErrorMessage(
              generate.error,
              'Failed to generate replies. Please try again.',
            )}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generate.mutate()}
            disabled={isDailyLimitReached}
          >
            <IconRefresh className="size-4" />
            {isDailyLimitReached ? 'Daily limit reached' : 'Try again'}
          </Button>
        </div>
      ) : latest && replies.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {formatDayLabel(latest.date, data!.timezone)}
          </h2>
          <div className="flex flex-col gap-4">
            {replies.map((reply, index) => (
              <div
                key={reply.id}
                className="animate-in fade-in-0 fill-mode-both duration-300 ease-out motion-safe:slide-in-from-bottom-1"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <SuggestedReplyCard
                  reply={reply}
                  xAccount={xAccount}
                  onUpdated={handleUpdated}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <Button
            onClick={() => generate.mutate()}
            disabled={isDailyLimitReached}
          >
            {!isDailyLimitReached && <IconSparkles className="size-4" />}
            {isDailyLimitReached ? 'Daily limit reached' : 'Generate replies'}
          </Button>
          <p className="text-muted-foreground text-sm max-w-sm text-balance">
            No suggested replies yet. Generate a batch and we&rsquo;ll surface
            fresh posts from your niche with replies drafted in your voice —
            ready to review, tweak, and post in seconds.
          </p>
        </div>
      )}

    </div>
  )
}
