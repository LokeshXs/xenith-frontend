import { apiClient } from '../api'

export interface TwitterPost {
  id: string
  text: string
  createdAt: string
}

export interface TwitterPostsResponse {
  posts: TwitterPost[]
  meta: { newest_id?: string; oldest_id?: string; result_count: number }
}

export async function getTwitterAuthUrl(redirectTo?: string): Promise<string> {
  const { data } = await apiClient.get<{ authUrl: string }>('/twitter/connect', {
    params: redirectTo ? { redirectTo } : undefined,
  })
  return data.authUrl
}

export async function doTwitterPostsAnalysis(): Promise<TwitterPostsResponse> {
  const { data } = await apiClient.get<TwitterPostsResponse>('/twitter/twitter-profile-analysis')
  return data
}
