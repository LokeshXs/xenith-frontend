"use client"

import { useCallback, useState } from "react"
import { IconCreditCard, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  createBillingPortalSession,
  type BillingSubscriptionStatus,
} from "@/lib/services/billing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BillingGraceBannerProps = {
  accessToken: string
  status: BillingSubscriptionStatus
  accessExpiresAt: string | null
  // Spacing is the mount site's job: the dashboard shell adds no padding of its
  // own, while onboarding places the banner inside an already-padded column.
  className?: string
}

function remainingCopy(accessExpiresAt: string | null): string {
  if (!accessExpiresAt) return "Access will end soon."

  const endsAt = new Date(accessExpiresAt)
  if (Number.isNaN(endsAt.getTime())) return "Access will end soon."

  const msRemaining = endsAt.getTime() - Date.now()
  if (msRemaining <= 0) return "Access has ended."

  const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000))
  if (hoursRemaining <= 1) return "Access ends within the hour."
  if (hoursRemaining < 24) return `Access ends in ${hoursRemaining} hours.`

  // Round up so the last partial day still reads as a day rather than "0 days".
  const daysRemaining = Math.ceil(hoursRemaining / 24)
  return `Access ends in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}.`
}

/**
 * Shown for the whole on-hold grace window. Deliberately not dismissible — it is a
 * countdown to losing access, and the only way out is updating the payment method.
 */
export function BillingGraceBanner({
  accessToken,
  status,
  accessExpiresAt,
  className,
}: BillingGraceBannerProps) {
  const [openingPortal, setOpeningPortal] = useState(false)

  const openPortal = useCallback(async () => {
    setOpeningPortal(true)
    const result = await createBillingPortalSession(accessToken)

    if (result.kind === "ok") {
      window.location.assign(result.portalUrl)
      return
    }

    setOpeningPortal(false)

    if (result.kind === "unauthorized") {
      window.location.assign("/signout")
      return
    }

    toast.error(result.message)
  }, [accessToken])

  if (status !== "on_hold") return null

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <IconCreditCard className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-medium">
            Your last payment failed. {remainingCopy(accessExpiresAt)}
          </p>
          <p className="mt-1 text-sm text-destructive/80">
            Update your payment method to keep your subscription — you don&rsquo;t
            need to start a new plan.
          </p>
        </div>
      </div>
      <Button
        onClick={() => void openPortal()}
        disabled={openingPortal}
        className="shrink-0 max-sm:w-full"
      >
        {openingPortal && (
          <IconLoader2 data-icon="inline-start" className="animate-spin" />
        )}
        {openingPortal ? "Opening billing…" : "Update payment method"}
      </Button>
    </div>
  )
}
