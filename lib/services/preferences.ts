import { apiClient } from '../api'

export interface UserPreferences {
  niche: string[]
  inspirationAccounts: string[]
  postsPerDay: string
  // Suggested replies generated per run. Stored as a string for the form state
  // (like postsPerDay); only "5" or "10" are valid.
  replyCount: string
  deliveryTime: string
}

// GET /user/preference returns snake_case + posts_per_day as a number; the form
// state uses camelCase strings, so we keep timezone alongside the normalized
// shape rather than threading two types through callers. `suggestedNiches` is
// the full list of niche options to render (read-only); `niche` is the user's
// selected subset, so it's not part of the save payload (UserPreferences).
export interface UserPreferencesData extends UserPreferences {
  suggestedNiches: string[]
  timezone: string
}

interface GetPreferencesResponse {
  data: {
    niche: string[]
    suggestedNiches: string[]
    inspirationAccounts: string[]
    posts_per_day: number
    reply_count: number
    delivery_time: string
    timezone: string
  }
}

export type UserPreferencesResult =
  | { kind: 'ok'; data: UserPreferencesData }
  | { kind: 'not_found' }
  | { kind: 'unauthorized' }
  | { kind: 'error' }

// Server-side fetch of GET /api/v1/user/preference. Mirrors fetchPostsToday:
// takes the Supabase JWT explicitly so it can run in a Server Component without
// the client-only axios apiClient. 404 is split out so the settings page can
// render an empty form for users who haven't saved preferences yet.
export async function fetchUserPreferences(
  accessToken: string,
): Promise<UserPreferencesResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/preference/`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    )
    if (res.status === 401) return { kind: 'unauthorized' }
    if (res.status === 404) return { kind: 'not_found' }
    if (!res.ok) return { kind: 'error' }
    const json = (await res.json()) as GetPreferencesResponse
    const p = json.data
    return {
      kind: 'ok',
      data: {
        niche: p.niche,
        suggestedNiches: p.suggestedNiches ?? [],
        inspirationAccounts: p.inspirationAccounts,
        postsPerDay: String(p.posts_per_day),
        replyCount: String(p.reply_count),
        deliveryTime: p.delivery_time,
        timezone: p.timezone,
      },
    }
  } catch {
    return { kind: 'error' }
  }
}

export async function saveUserPreferences(preferences: UserPreferences) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { data } = await apiClient.post('/user/preference', {
    ...preferences,
    niche: preferences.niche.filter((n) => n.trim() !== ''),
    inspirationAccounts: preferences.inspirationAccounts.filter(
      (a) => a.trim() !== '',
    ),
    // Backend validates replyCount as a number literal (5 | 10), so send a number.
    replyCount: Number(preferences.replyCount),
    timezone,
  })
  return data
}

// PATCH /api/v1/user/preference/. The API needs the full object every time
// (PATCH semantics here are "replace all fields", not "merge"), and the request
// stays camelCase even though the response comes back snake_case — we normalize
// the response so callers always see the form-shaped UserPreferencesData.
export async function updateUserPreferences(
  preferences: UserPreferences,
): Promise<UserPreferencesData> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const body = {
    niche: preferences.niche.filter((n) => n.trim() !== ''),
    inspirationAccounts: preferences.inspirationAccounts.filter(
      (a) => a.trim() !== '',
    ),
    postsPerDay: preferences.postsPerDay,
    // Backend validates replyCount as a number literal (5 | 10), so send a number.
    replyCount: Number(preferences.replyCount),
    deliveryTime: preferences.deliveryTime,
    timezone,
  }

  const { data } = await apiClient.patch<GetPreferencesResponse>(
    '/user/preference/',
    body,
  )
  const p = data.data
  return {
    niche: p.niche,
    suggestedNiches: p.suggestedNiches ?? [],
    inspirationAccounts: p.inspirationAccounts,
    postsPerDay: String(p.posts_per_day),
    replyCount: String(p.reply_count),
    deliveryTime: p.delivery_time,
    timezone: p.timezone,
  }
}
