import { apiClient } from '../api'
import type { GeneratedPost } from './posts'

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
