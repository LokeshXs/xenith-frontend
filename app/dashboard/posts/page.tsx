import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { fetchPosts, fetchPostsToday } from '@/lib/services/posts'
import type { GeneratedPost, XAccount } from '@/lib/services/posts'
import { formatDayLabel } from '@/lib/utils/day-label'
import { PostCard } from '../components/PostCard'
import { AiActionsProvider } from '../components/AiActionsContext'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Posts' }

type PostGroup = { key: string; label: string; posts: GeneratedPost[] }

// The calendar day (YYYY-MM-DD) a timestamp falls on, in the given IANA tz.
function dayKeyInTimezone(value: string, timeZone: string): string {
  // en-CA renders ISO-like YYYY-MM-DD, which sorts/compares cleanly.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

// Group posts (already sorted newest-first) by local calendar day.
function groupPostsByDay(
  posts: GeneratedPost[],
  timeZone: string,
): PostGroup[] {
  const groups: PostGroup[] = []
  const byKey = new Map<string, PostGroup>()

  for (const post of posts) {
    const key = dayKeyInTimezone(post.generated_at, timeZone)
    let group = byKey.get(key)
    if (!group) {
      group = { key, label: formatDayLabel(key, timeZone), posts: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.posts.push(post)
  }

  return groups
}

export default async function PostsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // proxy.ts gates this route, but a missing token here means the session
  // vanished between middleware and render — bounce to login.
  if (!session?.access_token) {
    redirect('/login')
  }

  // The /posts list endpoint returns neither the X account nor the timezone,
  // so reuse the today endpoint in parallel purely for those two values.
  const [list, today] = await Promise.all([
    fetchPosts(session.access_token, { limit: 100 }),
    fetchPostsToday(session.access_token),
  ])

  if (list.kind === 'unauthorized') {
    // Cookies can't be mutated from an RSC; /signout clears the Supabase
    // session and 307s to /login.
    redirect('/signout')
  }

  if (list.kind === 'error') {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
        <p className="text-sm text-destructive text-center">
          Something went wrong loading your posts. Please try again.
        </p>
      </div>
    )
  }

  const xAccount: XAccount | null =
    today.kind === 'ok' ? today.data.xAccount : null
  const timezone = today.kind === 'ok' ? today.data.timezone : 'UTC'

  const posts = list.data.posts
  const groups = groupPostsByDay(posts, timezone)

  // Continuous index across groups so the entrance stagger flows naturally.
  let cardIndex = 0

  return (
    <AiActionsProvider initialSummary={list.data.ai_actions}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
      <header className="flex items-baseline gap-3">
        <h1 className="text-2xl max-sm:text-xl font-semibold tracking-tight">Posts</h1>
        {posts.length > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {posts.length} post{posts.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      {posts.length > 0 ? (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h2>
              <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [column-fill:_balance]">
                {group.posts.map((post) => {
                  const delay = Math.min(cardIndex++, 8) * 40
                  return (
                    <div
                      key={post.id}
                      className="break-inside-avoid animate-in fade-in-0 fill-mode-both duration-300 ease-out motion-safe:slide-in-from-bottom-1"
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      <PostCard post={post} xAccount={xAccount} />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No posts yet — your generated posts will appear here.
          </p>
        </div>
      )}
      </div>
    </AiActionsProvider>
  )
}
