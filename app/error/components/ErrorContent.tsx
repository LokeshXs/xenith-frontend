'use client'

import { useRouter } from 'next/navigation'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type ErrorDetail = {
  title: string
  description: string
}

const ERROR_DETAILS: Record<string, ErrorDetail> = {
  access_denied: {
    title: 'Authorization declined',
    description:
      "You declined to authorize the X connection. You can try again whenever you're ready.",
  },
  invalid_state: {
    title: 'Authorization invalid',
    description:
      'The authorization request was invalid. Please start the connection again.',
  },
  state_expired: {
    title: 'Session expired',
    description:
      'The authorization session timed out. Please reconnect your X account.',
  },
  token_exchange_failed: {
    title: "Couldn't connect to X",
    description:
      "We couldn't complete the connection with X. Please try again in a moment.",
  },
}

const FALLBACK_DETAIL: ErrorDetail = {
  title: 'Connection failed',
  description: "We couldn't connect your X account. Please try again.",
}

type ErrorContentProps = {
  reason?: string
}

export function ErrorContent({ reason }: ErrorContentProps) {
  const router = useRouter()
  const detail = (reason ? ERROR_DETAILS[reason] : undefined) ?? FALLBACK_DETAIL

  return (
    <Card className="container mx-auto max-w-md w-full">
      <CardHeader>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <IconAlertTriangle className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight">
              {detail.title}
            </h2>
            <p className="text-sm text-muted-foreground">{detail.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/onboarding')}
        >
          Try again
        </Button>
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          Go to dashboard
        </Button>
      </CardContent>
    </Card>
  )
}
