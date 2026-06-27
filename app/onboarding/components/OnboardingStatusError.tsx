'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'

export function OnboardingStatusError({
  title = 'Something went wrong',
  description = "We couldn't load your onboarding status. Please try again.",
}: {
  title?: string
  description?: string
}) {
  const router = useRouter()

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <h2 className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent className="flex justify-end gap-2">
        <Button variant="ghost" nativeButton={false} render={<a href="/signout" />}>
          Log out
        </Button>
        <Button variant="secondary" nativeButton={false} render={<Link href="/" />}>
          Home
        </Button>
        <Button onClick={() => router.refresh()}>Retry</Button>
      </CardContent>
    </Card>
  )
}
