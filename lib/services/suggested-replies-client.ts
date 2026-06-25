import { apiClient } from '../api'
import type {
  SuggestedRepliesHistoryResponse,
  SuggestedRepliesResponse,
  SuggestedReply,
} from './suggested-replies'

// POST /api/v1/suggested-replies/generate — regenerates a fresh batch on demand
// (the replies-view Refresh and the dashboard's "Generate suggested replies"
// action). Always regenerates; slow (calls the AI + X API). The batch size is
// fixed server-side by appConfig.suggestedReplies.defaultCount.
export async function generateSuggestedReplies(): Promise<SuggestedRepliesResponse> {
  const { data } = await apiClient.post<SuggestedRepliesResponse>(
    '/suggested-replies/generate',
  )
  return data
}

// GET /api/v1/suggested-replies — read-only reply history, grouped by calendar
// day (newest first) and paginated by day. Never generates; safe to call on
// mount and on scroll. `limit` is days per page (default 7, max 30).
export async function fetchSuggestedRepliesHistory(
  page = 1,
  limit = 7,
): Promise<SuggestedRepliesHistoryResponse> {
  const { data } = await apiClient.get<SuggestedRepliesHistoryResponse>(
    '/suggested-replies',
    { params: { page, limit } },
  )
  return data
}

interface UpdateSuggestedReplyResponse {
  reply: SuggestedReply
}

// PATCH /api/v1/suggested-replies/:id — saves an edited reply (≤280 chars),
// sets edited: true, and returns the full updated row.
export async function updateSuggestedReply(
  id: number,
  suggestedReply: string,
): Promise<SuggestedReply> {
  const { data } = await apiClient.patch<UpdateSuggestedReplyResponse>(
    `/suggested-replies/${id}`,
    { suggested_reply: suggestedReply },
  )
  return data.reply
}

// POST /api/v1/suggested-replies/:id/publish — posts the reply to X now.
// Idempotent (re-POSTing a posted reply returns it unchanged); a failed reply
// can be retried. Returns the full updated row (same shape as PATCH).
export async function publishSuggestedReply(id: number): Promise<SuggestedReply> {
  const { data } = await apiClient.post<UpdateSuggestedReplyResponse>(
    `/suggested-replies/${id}/publish`,
  )
  return data.reply
}

// POST /api/v1/blocked-accounts — blocks the author of a suggested reply so
// they won't appear in future generation runs. Idempotent (re-blocking returns
// 201 with the refreshed row). Returns the created/refreshed BlockedAccount.
export async function blockAccountFromReply(replyId: number): Promise<unknown> {
  const { data } = await apiClient.post<{ blocked: unknown }>(
    '/blocked-accounts',
    { replyId },
  )
  return data.blocked
}
