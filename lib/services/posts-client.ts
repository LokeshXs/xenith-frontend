import { apiClient } from '../api'
import type { GeneratedPost, PostsTodayResponse } from './posts'

// GET /api/v1/posts/today — today's posts (auto or manual). Client-side
// counterpart to the server `fetchPostsToday`, used to reload after a 409.
export async function fetchPostsTodayClient(): Promise<PostsTodayResponse> {
  const { data } = await apiClient.get<PostsTodayResponse>('/posts/today')
  return data
}

export interface UpdatePostInput {
  // Send one or both; at least one is required by the backend.
  content?: string
  hashtags?: string[]
}

interface UpdatePostResponse {
  post: GeneratedPost
}

// PATCH /api/v1/posts/:id — returns the full updated post.
export async function updatePost(
  id: number,
  input: UpdatePostInput,
): Promise<GeneratedPost> {
  const { data } = await apiClient.patch<UpdatePostResponse>(
    `/posts/${id}`,
    input,
  )
  return data.post
}

interface PostResponse {
  post: GeneratedPost
}

// POST /api/v1/posts/:id/publish — publishes to X now. Idempotent.
export async function publishPost(id: number): Promise<GeneratedPost> {
  const { data } = await apiClient.post<PostResponse>(`/posts/${id}/publish`)
  return data.post
}

// POST /api/v1/posts/:id/schedule — schedules auto-publish at a future time.
// scheduledAt must be an ISO 8601 datetime with an offset (or Z), in the future.
export async function schedulePost(
  id: number,
  scheduledAt: string,
): Promise<GeneratedPost> {
  const { data } = await apiClient.post<PostResponse>(`/posts/${id}/schedule`, {
    scheduled_at: scheduledAt,
  })
  return data.post
}

// POST /api/v1/posts/:id/unschedule — cancels a scheduled post → pending.
export async function unschedulePost(id: number): Promise<GeneratedPost> {
  const { data } = await apiClient.post<PostResponse>(`/posts/${id}/unschedule`)
  return data.post
}
