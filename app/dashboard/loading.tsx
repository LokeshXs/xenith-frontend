
import { TextShimmer } from '@/components/ui/text-shimmer'

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center px-6 md:min-h-svh"
    >
      <div className="flex flex-col items-center gap-4">
       

        <TextShimmer
          as="p"
          duration={1.6}
          spread={1.5}
          className="text-sm font-medium tracking-tight text-muted-foreground"
        >
          Loading your dashboard…
        </TextShimmer>
      </div>
    </main>
  )
}
