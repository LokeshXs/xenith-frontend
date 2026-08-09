import axios from 'axios'
import { getAccessToken, signOut } from './supabase/auth-service'

export const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

export const SUBSCRIPTION_REQUIRED_EVENT = 'xenith:subscription-required'

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// On 401, clear the session and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    if (
      error.response?.status === 402 &&
      error.response?.data?.code === 'SUBSCRIPTION_REQUIRED' &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new Event(SUBSCRIPTION_REQUIRED_EVENT))
    }
    return Promise.reject(error)
  }
)
