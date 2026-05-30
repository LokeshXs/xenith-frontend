'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { apiClient } from '@/lib/api'
import type { GeneratedPost, XAccount } from '@/lib/services/posts'
import { PostCard } from './PostCard'

const ERROR_REASON_MAP: Record<string, string> = {
  access_denied: 'You declined to authorize the X connection.',
  invalid_state: 'The authorization request was invalid. Please try again.',
  state_expired: 'The authorization session expired. Please try again.',
  token_exchange_failed: 'Failed to connect your X account. Please try again.',
}

async function generatePosts() {
  const { data } = await apiClient.get('/posts/generate')
  console.log(data)
}

type DashboardClientProps = {
  initialPosts: GeneratedPost[]
  timezone: string
  xAccount: XAccount | null
}

export function DashboardClient({
  initialPosts,
  timezone,
  xAccount,
}: DashboardClientProps) {
  const searchParams = useSearchParams()
  const twitterParam = searchParams.get('twitter')
  const reasonParam = searchParams.get('reason')

  const [bannerDismissed, setBannerDismissed] = useState(false)

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
      <SidebarTrigger className="md:hidden" />

      {showSuccessBanner && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="text-sm font-medium">X account connected successfully!</p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-green-600 hover:text-green-900 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {showErrorBanner && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Today's posts</h2>

        {initialPosts.length > 0 ? (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [column-fill:_balance]">
            {initialPosts.map((post) => (
              <PostCard key={post.id} post={post} xAccount={xAccount} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            {/* TODO: show delivery time from preferences API — "your posts will be ready at <time>" */}
            <p className="text-muted-foreground text-sm">
              No posts yet today — your posts will be ready soon.
            </p>
            <p className="text-muted-foreground text-xs">Timezone: {timezone}</p>
          </div>
        )}
      </section>

      <div className="flex justify-center">
        <Button onClick={() => generatePosts()}>Generate</Button>
      </div>
    </div>
  )
}
