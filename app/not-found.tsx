'use client'

import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconHome } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p
        aria-hidden
        className="bg-gradient-to-b from-foreground/15 to-foreground/5 bg-clip-text text-8xl font-semibold tracking-tighter text-transparent sm:text-9xl"
      >
        404
      </p>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>

      <div className="mt-8 flex items-center gap-2">
     
        <form action="/">
          <Button type="submit">
            <IconHome />
            Back to home
          </Button>
        </form>
      </div>
    </main>
  )
}
