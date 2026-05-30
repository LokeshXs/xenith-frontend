import { apiClient } from '../api'

export interface UserPreferences {
  niche: string[]
  postType: string[]
  inspirationAccounts: string[]
  postsPerDay: string
  deliveryTime: string
}

export async function saveUserPreferences(preferences: UserPreferences) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { data } = await apiClient.post('/user/preference', {
    ...preferences,
    niche: preferences.niche.filter((n) => n.trim() !== ''),
    inspirationAccounts: preferences.inspirationAccounts.filter(
      (a) => a.trim() !== '',
    ),
    timezone,
  })
  return data
}


