"use client"

import { IconAlertCircle, IconCreditCard, IconLock, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBillingAccess } from "./BillingAccessProvider"

function accessCountdown(accessExpiresAt: string | null) {
  if (!accessExpiresAt) return "Access will end soon."
  const end = new Date(accessExpiresAt)
  if (Number.isNaN(end.getTime())) return "Access will end soon."

  const hours = Math.ceil((end.getTime() - Date.now()) / 3_600_000)
  if (hours <= 0) return "Access has ended."
  if (hours <= 1) return "Access ends within the hour."
  if (hours < 24) return `Access ends in ${hours} hours.`

  const days = Math.ceil(hours / 24)
  return `Access ends in ${days} ${days === 1 ? "day" : "days"}.`
}

function formattedEndDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function DashboardBillingBanner({ className }: { className?: string }) {
  const {
    subscription,
    checkingStatus,
    submittingPlan,
    openingPortal,
    openBillingModal,
    refreshBillingStatus,
    subscribeToPlan,
    openBillingPortal,
  } = useBillingAccess()

  if (!subscription.available) {
    return (
      <Banner
        className={className}
        icon={<IconAlertCircle className="size-5" />}
        title="Billing status is temporarily unavailable"
        description="Your saved content remains available while we reconnect."
        action={
          <Button
            variant="outline"
            onClick={() => void refreshBillingStatus()}
            disabled={checkingStatus}
          >
            <IconRefresh data-icon="inline-start" className={checkingStatus ? "animate-spin" : undefined} />
            {checkingStatus ? "Checking…" : "Try again"}
          </Button>
        }
      />
    )
  }

  if (subscription.status === "on_hold") {
    return (
      <Banner
        tone="danger"
        className={className}
        icon={<IconCreditCard className="size-5" />}
        title={`Your last payment failed. ${accessCountdown(subscription.accessExpiresAt)}`}
        description="Update your payment method to keep this subscription."
        action={
          <Button onClick={() => void openBillingPortal()} disabled={openingPortal}>
            {openingPortal ? "Opening billing…" : "Update payment method"}
          </Button>
        }
      />
    )
  }

  if (subscription.hasAccess && subscription.cancelAtPeriodEnd) {
    const endDate = formattedEndDate(subscription.accessExpiresAt)
    const plan = subscription.plan
    return (
      <Banner
        className={className}
        icon={<IconAlertCircle className="size-5" />}
        title="Your subscription is scheduled to end"
        description={endDate ? `Creator access remains active through ${endDate}.` : "Creator access remains active through the current billing period."}
        action={
          plan ? (
            <Button
              variant="outline"
              onClick={() => void subscribeToPlan(plan)}
              disabled={submittingPlan !== null}
            >
              {submittingPlan ? "Resuming…" : "Keep subscription"}
            </Button>
          ) : undefined
        }
      />
    )
  }

  if (!subscription.hasAccess) {
    return (
      <Banner
        className={className}
        icon={<IconLock className="size-5" />}
        title="Your workspace is in read-only mode"
        description="Your saved posts and replies are available. Activate Creator to create, edit, publish, and schedule."
        action={<Button onClick={openBillingModal}>{subscription.status === "free" ? "Choose a plan" : "Reactivate Creator"}</Button>}
      />
    )
  }

  return null
}

function Banner({
  className,
  tone = "neutral",
  icon,
  title,
  description,
  action,
}: {
  className?: string
  tone?: "neutral" | "danger"
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        tone === "danger"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-border bg-muted/45 text-foreground",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden>{icon}</span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className={cn("mt-1 text-sm", tone === "danger" ? "text-destructive/80" : "text-muted-foreground")}>
            {description}
          </p>
        </div>
      </div>
      {action && <div className="shrink-0 max-sm:[&>button]:w-full">{action}</div>}
    </div>
  )
}
