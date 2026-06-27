'use client'

import { useState } from 'react'
import { IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useFormContext } from '../context/FormContext'
import { getTwitterAuthUrl } from '@/lib/services/twitter'
import { getErrorMessage } from '../utils/getErrorMessage'

export function ConnectXStep() {
  const { statusSteps } = useFormContext()

  const xConnected = statusSteps?.xAccount ?? false

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setIsConnecting(true)
    setError(null)
    try {
      const authUrl = await getTwitterAuthUrl('/onboarding')
      window.location.href = authUrl
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not start X authorization. Please try again.'))
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {xConnected ? (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <IconCheck className="size-4 shrink-0" aria-hidden />
          <span>X account connected</span>
        </div>
      ) : (
        <Button onClick={handleConnect} disabled={isConnecting} size="lg">
          {isConnecting ? 'Redirecting to X…' : 'Connect your X account'}
        </Button>
      )}
    </div>
  )
}
