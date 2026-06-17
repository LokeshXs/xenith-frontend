import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Placeholder matching a PostCard's shape, shown while the generation pipeline
// runs. Lives in the same `columns-*` grid so the layout doesn't jump when real
// cards replace it.
export function PostCardSkeleton() {
  return (
    <Card className="mb-4 break-inside-avoid gap-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </Card>
  )
}
