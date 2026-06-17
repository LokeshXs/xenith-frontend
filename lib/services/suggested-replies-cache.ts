import type { InfiniteData } from '@tanstack/react-query'
import type {
  SuggestedReply,
  SuggestedRepliesHistoryResponse,
} from './suggested-replies'

// Replace a reply (matched by id) within a single history page's day groups.
// Returns the same reference when nothing matched so React Query can bail out.
export function patchReplyInHistory(
  data: SuggestedRepliesHistoryResponse | undefined,
  updated: SuggestedReply,
): SuggestedRepliesHistoryResponse | undefined {
  if (!data) return data
  return {
    ...data,
    groups: data.groups.map((group) => ({
      ...group,
      replies: group.replies.map((r) => (r.id === updated.id ? updated : r)),
    })),
  }
}

// Same patch, applied across every page of an infinite history query.
export function patchReplyInInfinite(
  data: InfiniteData<SuggestedRepliesHistoryResponse> | undefined,
  updated: SuggestedReply,
): InfiniteData<SuggestedRepliesHistoryResponse> | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => patchReplyInHistory(page, updated)!),
  }
}
