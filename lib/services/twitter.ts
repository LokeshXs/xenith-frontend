import { apiClient } from '../api'

export interface TwitterProfileAnalysis {
  success: boolean
  x_username: string
  suggestedNiches: string[] // full list of niche chips to render (≤20)
  preselectedNiches: string[] // subset of suggestedNiches, checked by default
}

export interface TwitterStatus {
  /** Token is valid (refreshed if it was near expiry). When false, the user must (re)connect. */
  status: boolean
  /** Whether an X account is linked at all. */
  connected: boolean
  /** Connected but the refresh token is dead → must re-authorize. */
  needsReconnect?: boolean
}

export async function getTwitterStatus(): Promise<TwitterStatus> {
  const { data } = await apiClient.get<TwitterStatus>('/twitter/status')
  return data
}

export async function getTwitterAuthUrl(redirectTo?: string): Promise<string> {
  const { data } = await apiClient.get<{ authUrl: string }>('/twitter/connect', {
    params: redirectTo ? { redirectTo } : undefined,
  })
  return data.authUrl
}

export async function doTwitterPostsAnalysis(): Promise<TwitterProfileAnalysis> {
  const { data } = await apiClient.get<TwitterProfileAnalysis>('/twitter/twitter-profile-analysis')
  return data
}
