'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useFormContext } from '../context/FormContext'
import { getTwitterAuthUrl, doTwitterPostsAnalysis } from '@/lib/services/twitter'

type AnalysisPhase = 'idle' | 'analyzing' | 'done' | 'error'

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { response?: { data?: { error?: string } } }
    return maybe.response?.data?.error ?? fallback
  }
  return fallback
}

export function ConnectXStep() {
  const router = useRouter()
  const { statusSteps, goToStep } = useFormContext()

  const xConnected = statusSteps?.xAccount ?? false
  const hasStyleProfile = statusSteps?.styleProfile ?? false
  const hasPreferences = statusSteps?.preferences ?? false

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // When already connected, derive the starting phase from server status:
  // a style profile means we're done, otherwise we analyze automatically.
  const [phase, setPhase] = useState<AnalysisPhase>(() => {
    if (!xConnected) return 'idle'
    return hasStyleProfile ? 'done' : 'analyzing'
  })
  // Bumped to re-run the analysis effect when the user retries after an error.
  const [retryToken, setRetryToken] = useState(0)

  // Once a style profile exists, route the user onward: preferences already
  // set → dashboard, otherwise continue with the rest of onboarding (Niche).
  const proceedAfterStyleProfile = useCallback(() => {
    if (hasPreferences) {
      router.replace('/dashboard')
    } else {
      goToStep(1)
    }
  }, [hasPreferences, router, goToStep])

  useEffect(() => {
    // Not connected yet: show the connect button and do nothing else.
    if (!xConnected) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    // Already analyzed: the phase starts as 'done', just confirm then move on.
    if (hasStyleProfile) {
      timer = setTimeout(() => {
        if (!cancelled) proceedAfterStyleProfile()
      }, 1000)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    // Connected but no style profile: analyze the user's posts automatically.
    ;(async () => {
      try {
        await doTwitterPostsAnalysis()
        if (cancelled) return
        setPhase('done')
        timer = setTimeout(() => {
          if (!cancelled) proceedAfterStyleProfile()
        }, 1000)
      } catch (err: unknown) {
        if (cancelled) return
        setError(getErrorMessage(err, 'Failed to analyze your X posts. Please try again.'))
        setPhase('error')
      }
    })()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [xConnected, hasStyleProfile, proceedAfterStyleProfile, retryToken])

  function handleRetry() {
    setError(null)
    setPhase('analyzing')
    setRetryToken((t) => t + 1)
  }

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Connect your X account</h2>
        <p className="text-muted-foreground">
          Import your recent posts to personalize your content and make generated posts feel like you.
        </p>
      </div>
      <ul className="text-sm text-muted-foreground space-y-2">
        <li>• Learn your writing style from your own posts</li>
        <li>• Generate content that sounds authentically like you</li>
        <li>• Improve suggestions over time</li>
      </ul>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {xConnected ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-green-700">X account connected!</p>
          {phase === 'analyzing' && (
            <p className="text-xs text-muted-foreground">
              Analyzing your recent X posts to learn your writing style…
            </p>
          )}
          {phase === 'done' && (
            <p className="text-xs text-muted-foreground">Done — we&apos;ve learned your style.</p>
          )}
          {phase === 'error' && (
            <Button onClick={handleRetry} variant="outline" size="sm">
              Try again
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Button onClick={handleConnect} disabled={isConnecting} className="w-full" size="lg">
            {isConnecting ? 'Redirecting to X…' : 'Connect X Account'}
          </Button>
          <p className="text-xs text-muted-foreground">
            You can skip this and connect later from your dashboard.
          </p>
        </div>
      )}
    </div>
  )
}
