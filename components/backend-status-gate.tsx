'use client'

import { useRouter } from 'next/navigation'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

/**
 * Full-page downtime screen shown when the backend health check fails.
 * The retry button triggers a page refresh so the server re-evaluates health.
 */
export function BackendStatusGate() {
  const router = useRouter()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-4xl bg-muted text-muted-foreground">
        <IconAlertTriangle className="size-7" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
        We&rsquo;ll be right back
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Our servers aren&rsquo;t responding right now. The team is already working
        on it — please try again in a few minutes.
      </p>

      <div className="mt-8">
        <Button onClick={() => router.refresh()}>
          <IconRefresh />
          Try again
        </Button>
      </div>
    </main>
  )
}
