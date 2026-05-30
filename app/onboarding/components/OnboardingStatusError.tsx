'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function OnboardingStatusError() {
  const router = useRouter()

  return (
    <Card className="container mx-auto max-w-md w-full">
      <CardHeader>
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your onboarding status. Please try again.
        </p>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button onClick={() => router.refresh()}>Retry</Button>
      </CardContent>
    </Card>
  )
}
