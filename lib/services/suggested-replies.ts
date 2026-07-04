import type { XAccount } from './posts'
import type { ReplyCreditSummary } from './billing'

export interface SuggestedReplySourceMetrics {
  like_count?: number
  reply_count?: number
  retweet_count?: number
  quote_count?: number
  bookmark_count?: number
  impression_count?: number
}

export interface SuggestedReply {
  id: number // use for PATCH /suggested-replies/:id
  batch_id: string
  user_id: string

  // ── snapshot of the post being replied to ──
  source_tweet_id: string // link: `https://x.com/i/status/${source_tweet_id}`
  source_text: string
  source_author_id: string | null
  source_author_username: string | null // without "@"
  source_author_name: string | null
  source_author_avatar: string | null
  source_lang: string | null // BCP-47-ish code from X, e.g. "en", "hi"
  source_created_at: string | null // ISO 8601
  source_metrics: SuggestedReplySourceMetrics | null

  // ── AI output ──
  suggested_reply: string // ≤280 chars, same language as the post
  edited: boolean

  created_at: string
  updated_at: string
}

export type ReplyGenerationLimitSummary = {
  limited: boolean
  limit: number | null
  completed_today: number
  active_today: number
  remaining_today: number | null
  reset_at: string | null
  timezone: string
}

export interface ReplyGenerationNotice {
  type: 'shortage'
  requested: number
  generated: number
  message: string
}

// Response of GET /api/v1/suggested-replies/generate — used by the dashboard's
// "Generate suggested replies" action to produce a fresh batch on demand.
export interface SuggestedRepliesResponse {
  // IANA tz used for the day boundary (Preferences.timezone, defaults "UTC")
  timezone: string
  // The newly generated batch, flat. Newest run first; [] if nothing produced.
  replies: SuggestedReply[]
  // The connected X account to reply as; null if not connected.
  xAccount: XAccount | null
  // Current reply-credit balance after this generation request.
  reply_credits: ReplyCreditSummary
  reply_generation_limit: ReplyGenerationLimitSummary
  reply_generation_notice: ReplyGenerationNotice | null
}

// One calendar day's worth of replies (newest day first across groups).
export interface SuggestedReplyGroup {
  date: string // YYYY-MM-DD in the user's timezone
  replies: SuggestedReply[] // newest first within the day
}

// GET /api/v1/suggested-replies — read-only history, grouped by day, paginated.
export interface SuggestedRepliesHistoryResponse {
  // IANA tz the day boundaries are computed in (Preferences.timezone, "UTC").
  timezone: string
  // The connected X account to reply as; null if not connected.
  xAccount: XAccount | null
  // Newest day first; [] when there's no history. A day is never split across
  // pages, so groups from consecutive pages can be concatenated safely.
  groups: SuggestedReplyGroup[]
  pagination: {
    page: number
    limit: number
    totalDays: number
    hasMore: boolean
  }
  reply_generation_limit: ReplyGenerationLimitSummary
  reply_generation_notice: ReplyGenerationNotice | null
}
