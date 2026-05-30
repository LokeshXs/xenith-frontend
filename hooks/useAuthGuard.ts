'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface UseAuthGuardOptions {
  redirectTo?: string
  redirectIfAuthenticated?: string
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): {
  isLoading: boolean
  isAuthenticated: boolean
} {
  const { redirectTo = '/login', redirectIfAuthenticated } = options
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated && !redirectIfAuthenticated) {
      router.replace(redirectTo)
      return
    }

    if (isAuthenticated && redirectIfAuthenticated) {
      router.replace(redirectIfAuthenticated)
    }
  }, [isAuthenticated, isLoading, redirectTo, redirectIfAuthenticated, router])

  return { isLoading, isAuthenticated }
}
