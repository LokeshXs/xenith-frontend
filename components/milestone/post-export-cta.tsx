"use client"

import Link from "next/link"
import { IconArrowRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/AuthContext"
import { trackMilestoneEvent } from "@/lib/analytics/milestone"

export function PostExportCta() {
  const { isAuthenticated, isLoading } = useAuth()
  const href = isAuthenticated
    ? "/dashboard/todays-posts"
    : "/register?redirectTo=%2Fonboarding"
  const label = isAuthenticated ? "Open Today’s Posts" : "Start Growing With Xenith"

  return (
    <section className="flex flex-col gap-4" aria-labelledby="milestone-xenith-cta-title">
      <Separator />
      <div className="flex flex-col gap-2">
        <h3 id="milestone-xenith-cta-title" className="text-base font-semibold text-balance">
          Make Your Next Milestone Happen Sooner
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Xenith turns what’s working in your niche into daily posts and relevant replies, ready for you to review.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-full" aria-label="Loading account status" />
      ) : (
        <Button
          nativeButton={false}
          render={<Link href={href} />}
          onClick={() => {
            trackMilestoneEvent("milestone_cta_clicked", {
              auth_state: isAuthenticated ? "authenticated" : "anonymous",
              destination: isAuthenticated ? "todays_posts" : "register",
            })
          }}
        >
          {label}
          <IconArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      )}
    </section>
  )
}
