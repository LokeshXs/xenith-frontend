'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

type Status = 'idle' | 'loading' | 'ok' | 'error'

export function HealthCheck() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    async function ping() {
      setStatus('loading')
      try {
        const res = await apiClient.get('/health')
        setStatus('ok')
        setMessage(JSON.stringify(res.data))
      } catch (err: unknown) {
        setStatus('error')
        // Show the error but still confirm token was sent — check Network tab
        setMessage(err instanceof Error ? err.message : 'Request failed')
      }
    }
    ping()
  }, [])

  const colors: Record<Status, string> = {
    idle: 'text-muted-foreground',
    loading: 'text-muted-foreground',
    ok: 'text-green-600',
    error: 'text-red-500',
  }

  const labels: Record<Status, string> = {
    idle: '',
    loading: '⏳ Pinging backend…',
    ok: `✓ Backend responded: ${message}`,
    error: `✗ Backend unreachable (check Network tab for Authorization header): ${message}`,
  }

  if (status === 'idle') return null

  return (
    <p className={`fixed bottom-4 right-4 text-xs max-w-sm text-right ${colors[status]}`}>
      {labels[status]}
    </p>
  )
}
