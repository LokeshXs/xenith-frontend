'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/app/onboarding/utils/getErrorMessage'
import type { SuggestedReply } from '@/lib/services/suggested-replies'
import { fetchSuggestedRepliesHistory } from '@/lib/services/suggested-replies-client'
import { patchReplyInInfinite } from '@/lib/services/suggested-replies-cache'
import { formatDayLabel } from '@/lib/utils/day-label'
import { SuggestedReplyCard } from './SuggestedReplyCard'

const ALL_QUERY_KEY = ['suggested-replies', 'history', 'all'] as const
const DAYS_PER_PAGE = 7

export function AllSuggestedReplies() {
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ALL_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchSuggestedRepliesHistory(pageParam, DAYS_PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
  })

  // Days never split across pages, so concatenating each page's groups yields a
  // correctly-ordered, gap-free list.
  const groups = useMemo(
    () => data?.pages.flatMap((page) => page.groups) ?? [],
    [data],
  )
  const timezone = data?.pages[0]?.timezone ?? 'UTC'
  const xAccount = data?.pages[0]?.xAccount ?? null

  const handleUpdated = (updated: SuggestedReply) => {
    queryClient.setQueryData(ALL_QUERY_KEY, (prev: typeof data) =>
      patchReplyInInfinite(prev, updated),
    )
  }

  // Auto-load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const header = (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/dashboard/suggested-replies"
          aria-label="Back to suggested replies"
          className={buttonVariants({
            variant: 'ghost',
            size: 'icon',
            className: 'shrink-0',
          })}
        >
          <IconArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl max-sm:text-xl font-semibold tracking-tight">
          All replies
        </h1>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => refetch()}
        disabled={isRefetching}
        className="self-start sm:self-auto"
      >
        <IconRefresh className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </header>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-destructive">
            {getErrorMessage(
              error,
              'Something went wrong loading your replies. Please try again.',
            )}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <IconRefresh className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {groups.length > 0 ? (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.date} className="flex flex-col gap-3">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {formatDayLabel(group.date, timezone)}
              </h2>
              <div className="flex flex-col gap-4">
                {group.replies.map((reply) => (
                  <SuggestedReplyCard
                    key={reply.id}
                    reply={reply}
                    xAccount={xAccount}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No replies yet — your suggested replies will appear here.
          </p>
        </div>
      )}

      {/* Infinite-scroll sentinel + paging states. */}
      {groups.length > 0 && (
        <div ref={sentinelRef} className="flex flex-col gap-4">
          {isFetchingNextPage &&
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          {!hasNextPage && !isFetchingNextPage && (
            <p className="text-center text-xs text-muted-foreground">
              You&rsquo;ve reached the end of your history.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
