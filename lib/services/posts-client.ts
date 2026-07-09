import { apiClient } from "../api";
import type { GeneratedPost, PostsTodayResponse } from "./posts";

// GET /api/v1/posts/today — today's posts (auto or manual). Client-side
// counterpart to the server `fetchPostsToday`, used to reload after a 409.
export async function fetchPostsTodayClient(): Promise<PostsTodayResponse> {
  const { data } = await apiClient.get<PostsTodayResponse>("/posts/today");
  return data;
}

export interface UpdatePostInput {
  // Send one or both; at least one is required by the backend.
  content?: string;
  hashtags?: string[];
}

interface UpdatePostResponse {
  post: GeneratedPost;
}

// PATCH /api/v1/posts/:id — returns the full updated post.
export async function updatePost(
  id: number,
  input: UpdatePostInput,
): Promise<GeneratedPost> {
  const { data } = await apiClient.patch<UpdatePostResponse>(
    `/posts/${id}`,
    input,
  );
  return data.post;
}

export type MemeCaptionTone =
  "funny" | "witty" | "sarcastic" | "relatable" | "dry" | "playful";

export interface GenerateMemeCaptionsInput {
  slot_count: number;
  max_chars_per_caption?: number;
  template_description: string;
  tone: MemeCaptionTone;
}

export interface MemeCaptionsResponse {
  captions: string[];
}

// POST /api/v1/posts/:id/meme-captions — generates generic meme captions.
export async function generateMemeCaptions(
  id: number,
  input: GenerateMemeCaptionsInput,
): Promise<string[]> {
  const { data } = await apiClient.post<MemeCaptionsResponse>(
    `/posts/${id}/meme-captions`,
    input,
  );
  return data.captions;
}

interface PostResponse {
  post: GeneratedPost;
}

export interface UpdatePostMemeInput {
  meme_template_id: string;
  meme_captions: string[];
  meme_text: string;
}

// PATCH /api/v1/posts/:id/meme — saves the selected meme template, captions, and optional text.
export async function updatePostMeme(
  id: number,
  input: UpdatePostMemeInput,
): Promise<GeneratedPost> {
  const { data } = await apiClient.patch<PostResponse>(
    `/posts/${id}/meme`,
    input,
  );
  return data.post;
}

// POST /api/v1/posts/:id/publish — publishes to X now. Idempotent.
export async function publishPost(id: number): Promise<GeneratedPost> {
  const { data } = await apiClient.post<PostResponse>(`/posts/${id}/publish`);
  return data.post;
}

// POST /api/v1/posts/:id/schedule — schedules auto-publish at a future time.
// scheduledAt must be an ISO 8601 datetime with an offset (or Z), in the future.
export async function schedulePost(
  id: number,
  scheduledAt: string,
): Promise<GeneratedPost> {
  const { data } = await apiClient.post<PostResponse>(`/posts/${id}/schedule`, {
    scheduled_at: scheduledAt,
  });
  return data.post;
}

// POST /api/v1/posts/:id/unschedule — cancels a scheduled post → pending.
export async function unschedulePost(id: number): Promise<GeneratedPost> {
  const { data } = await apiClient.post<PostResponse>(
    `/posts/${id}/unschedule`,
  );
  return data.post;
}
