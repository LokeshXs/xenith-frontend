export interface GeneratedPost {
  id: number
  user_id: string
  post_type: string
  content: string
  topic: string
  hashtags: string[]
  sources: { url: string; title: string }[]
  angle: string | null
  status: 'pending' | 'approved' | 'scheduled' | 'posted' | 'failed'
  run_id: string
  generated_at: string
  created_at: string
}

export interface XAccount {
  name: string
  username: string
  avatar: string
}

export interface PostsTodayResponse {
  // IANA tz used to compute "today" (Preferences.timezone, defaults "UTC")
  timezone: string
  // Ordered by generated_at descending; [] when nothing was generated today.
  posts: GeneratedPost[]
  // The connected X account these posts belong to; null if not connected.
  xAccount: XAccount | null
}

export type PostsTodayResult =
  | { kind: 'ok'; data: PostsTodayResponse }
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
