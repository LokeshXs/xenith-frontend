'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { isAxiosError } from 'axios'
import { IconX } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatTime12 } from '@/components/ui/time-picker'
import { apiClient } from '@/lib/api'
import type { GeneratedPost, XAccount } from '@/lib/services/posts'
import { fetchPostsTodayClient } from '@/lib/services/posts-client'
import { PostCard } from './PostCard'
import { PostCardSkeleton } from './PostCardSkeleton'

const ERROR_REASON_MAP: Record<string, string> = {
  access_denied: 'You declined to authorize the X connection.',
  invalid_state: 'The authorization request was invalid. Please try again.',
  state_expired: 'The authorization session expired. Please try again.',
  token_exchange_failed: 'Failed to connect your X account. Please try again.',
}

type DashboardClientProps = {
  initialPosts: GeneratedPost[]
  timezone: string
  // User's daily delivery time as "HH:MM" (24h) in `timezone`.
  deliveryTime: string
  xAccount: XAccount | null
}

export function DashboardClient({
  initialPosts,
  timezone,
  deliveryTime,
  xAccount,
}: DashboardClientProps) {
  const searchParams = useSearchParams()
  const twitterParam = searchParams.get('twitter')
  const reasonParam = searchParams.get('reason')

  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'engagement'>('newest')

  // Today's posts as local state so a manual generation run can replace the list
  // in place without a full page refetch.
  const [posts, setPosts] = useState(initialPosts)

  // Whether the user's local time is at/past their delivery time. When true and
  // there are no posts, the automatic pipeline likely failed and we offer a
  // manual trigger; when false, the posts simply aren't due yet. Computed once
  // at mount — landing on the page already triggers a fresh server fetch.
  const isPastDelivery = useMemo(() => {
    if (!deliveryTime) return false
    const now = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
    // Both are zero-padded "HH:MM", so lexical compare matches chronological.
    return now >= deliveryTime
  }, [timezone, deliveryTime])

  // Default order is newest-first (server order). "Sort by engagement" pushes
  // scored posts up by score and unscored (null) posts to the bottom.
  const displayPosts = useMemo(() => {
    if (sortBy === 'newest') return posts
    return [...posts].sort((a, b) => {
      const sa = a.engagement_score
      const sb = b.engagement_score
      if (sa === null && sb === null) return 0
      if (sa === null) return 1
      if (sb === null) return -1
      return sb - sa
    })
  }, [posts, sortBy])

  const anyScored = posts.some((p) => p.engagement_score !== null)

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      // POST /posts/generate is synchronous and slow — it runs the whole
      // pipeline. Capped to one run per day (shared with the auto run).
      const { data } = await apiClient.post('/posts/generate')
      const generated = (data?.posts ?? []) as GeneratedPost[]
      setPosts(generated)
      if (generated.length === 0) {
        toast.error('No posts were generated. Please try again.')
      }
    } catch (err) {
      // 401 is handled globally by the apiClient interceptor (signout + redirect).
      const status = isAxiosError(err) ? err.response?.status : undefined
      const apiMessage = isAxiosError(err)
        ? (err.response?.data?.error as string | undefined)
        : undefined

      if (status === 409) {
        // Already generated today (auto or manual) — not an error. Load today's
        // posts and surface them.
        try {
          const today = await fetchPostsTodayClient()
          setPosts(today.posts)
          toast.info('Posts have already been generated today.')
        } catch {
          toast.error('Failed to load today’s posts. Please refresh.')
        }
      } else if (
        (status === 400 || status === 402 || status === 500) &&
        apiMessage
      ) {
        toast.error(apiMessage)
      } else {
        toast.error('Failed to generate posts. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (twitterParam === 'connected') {
      const timer = setTimeout(() => setBannerDismissed(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [twitterParam])

  const showSuccessBanner = twitterParam === 'connected' && !bannerDismissed
  const showErrorBanner = twitterParam === 'error'
  const errorMessage =
    (reasonParam && ERROR_REASON_MAP[reasonParam]) ?? 'Failed to connect your X account.'

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
      {showSuccessBanner && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
          <p className="text-sm font-medium">X account connected successfully!</p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
            className="-m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-emerald-600/80 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-400/80 dark:hover:text-emerald-200"
          >
            <IconX className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {showErrorBanner && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl max-sm:text-xl font-semibold tracking-tight text-pretty">
            Today&rsquo;s posts
          </h1>

       
        </div>

        {posts.length > 0 ? (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [column-fill:_balance]">
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} xAccount={xAccount} />
            ))}
          </div>
        ) : isGenerating ? (
          // Skeleton grid covers the (synchronous) pipeline run until the real
          // cards arrive.
          <div
            role="status"
            aria-live="polite"
            className="columns-1 gap-4 sm:columns-2 xl:columns-3 [column-fill:_balance]"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
            <span className="sr-only">Generating your posts…</span>
          </div>
        ) : isPastDelivery ? (
          // Past delivery time with nothing generated → the automatic pipeline
          // likely failed. Offer a manual re-run.
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              We couldn&rsquo;t generate today&rsquo;s posts automatically.
              You can generate them now.
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              Generate now
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {deliveryTime
                ? `Your posts will be ready at ${formatTime12(deliveryTime)}.`
                : 'No posts yet today — your posts will be ready soon.'}
            </p>
            <p className="text-muted-foreground text-xs">Timezone: {timezone}</p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              Generate Now
            </Button>
          </div>
        )}
      </section>

    
    </div>
  )
}
