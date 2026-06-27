// Signal keys map 1:1 to the backend's per-action probability fields.
export interface EngagementSignals {
  p_like: number
  p_reply: number
  p_reply_engaged_by_author: number
  p_repost: number
  p_negative_feedback: number
}

// Full scoring breakdown behind `engagement_score`: the LLM's per-action
// probabilities combined with X's heavy-ranker weights. `top_driver` is the
// EngagementSignals key that contributed most to the score.
export interface EngagementBreakdown {
  index: number
  engagement_score: number
  signals: EngagementSignals
  weighted_raw: number
  top_driver: keyof EngagementSignals
}

export interface GeneratedPost {
  id: number
  user_id: string
  post_type: string
  content: string
  original_content: string | null
  topic: string
  hashtags: string[]
  original_hashtags: string[]
  edited: boolean
  sources: { url: string; title: string }[]
  angle: string | null
  status: 'pending' | 'approved' | 'scheduled' | 'posted' | 'failed'
  tweet_id: string | null
  published_at: string | null
  scheduled_at: string | null
  publish_error: string | null
  run_id: string
  generated_at: string
  created_at: string
  // Relative 0–100 likelihood-to-land score (not a forecast of real metrics).
  // null = not scored (scoring failed for the batch, or the row predates the
  // feature). Treat null as "no prediction", never as zero.
  engagement_score: number | null
  // Full breakdown behind the score (per-action probabilities + top driver).
  // null/absent for legacy rows or when scoring failed — render score-only then.
  engagement_signals?: EngagementBreakdown | null
}

export interface XAccount {
  name: string
  username: string
  avatar: string
}

export interface PostsTodayResponse {
  // IANA tz used to compute "today" (Preferences.timezone, defaults "UTC")
  timezone: string
  // User's daily delivery time as "HH:MM" (24h) in `timezone`.
  deliveryTime: string
  // Ordered by generated_at descending; [] when nothing was generated today.
  posts: GeneratedPost[]
  // The connected X account these posts belong to; null if not connected.
  xAccount: XAccount | null
}

export type PostsTodayResult =
  | { kind: 'ok'; data: PostsTodayResponse }
  | { kind: 'unauthorized' }
  | { kind: 'error' }

export interface PostsListResponse {
  // Ordered by generated_at descending; [] when nothing has been generated.
  posts: GeneratedPost[]
}

export type PostsListResult =
  | { kind: 'ok'; data: PostsListResponse }
  | { kind: 'unauthorized' }
  | { kind: 'error' }

// Server-side fetch of GET /api/v1/posts/today. Takes the Supabase JWT explicitly
// (mirrors fetchOnboardingStatus) so it can run in a Server Component without the
// client-only axios apiClient.
export async function fetchPostsToday(
  accessToken: string,
): Promise<PostsTodayResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/today`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    )
    if (res.status === 401) return { kind: 'unauthorized' }
    if (!res.ok) return { kind: 'error' }
    const data = (await res.json()) as PostsTodayResponse
    return { kind: 'ok', data }
  } catch {
    return { kind: 'error' }
  }
}

// Server-side fetch of GET /api/v1/posts (full history, newest first). Mirrors
// fetchPostsToday: takes the Supabase JWT explicitly so it can run in a Server
// Component without the client-only axios apiClient. There's no cursor
// pagination — limit is clamped server-side to 1–100.
export async function fetchPosts(
  accessToken: string,
  opts?: { limit?: number; runId?: string },
): Promise<PostsListResult> {
  try {
    const params = new URLSearchParams()
    params.set('limit', String(opts?.limit ?? 100))
    if (opts?.runId) params.set('runId', opts.runId)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    )
    if (res.status === 401) return { kind: 'unauthorized' }
    if (!res.ok) return { kind: 'error' }
    const data = (await res.json()) as PostsListResponse
    return { kind: 'ok', data }
  } catch {
    return { kind: 'error' }
  }
}
