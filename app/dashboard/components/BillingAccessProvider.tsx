"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  IconAlertCircle,
  IconCreditCard,
  IconLoader2,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { SUBSCRIPTION_REQUIRED_EVENT } from "@/lib/api"
import {
  createBillingPortalSession,
  createCheckout,
  fetchBillingStatus,
  type BillingPlan,
  type BillingStatus,
} from "@/lib/services/billing"
import type { UserRequirementsStatus } from "@/lib/services/user-requirements"
import {
  CreatorPlanCard,
  type CreatorBillingCycle,
} from "@/components/billing/creator-plan-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type DashboardSubscription =
  UserRequirementsStatus["requirements"]["subscription"]

type BillingAccessContextValue = {
  subscription: DashboardSubscription
  statusError: string | null
  checkingStatus: boolean
  submittingPlan: BillingPlan | null
  openingPortal: boolean
  openBillingModal: () => void
  requirePaidAccess: () => boolean
  refreshBillingStatus: () => Promise<void>
  subscribeToPlan: (plan: BillingPlan) => Promise<void>
  openBillingPortal: () => Promise<void>
}

const BillingAccessContext = createContext<BillingAccessContextValue | null>(null)

function subscriptionFromBillingStatus(
  billing: BillingStatus,
): DashboardSubscription {
  return {
    available: true,
    plan: billing.plan,
    status: billing.status,
    hasAccess: billing.has_access,
    accessExpiresAt: billing.access_expires_at,
    cancelAtPeriodEnd: billing.cancel_at_period_end,
    trialEndsAt: billing.trial_ends_at,
    isTrialing: billing.is_trialing,
    trialDaysRemaining: billing.trial_days_remaining,
  }
}

function unpaidEpisodeKey(userId: string, subscription: DashboardSubscription) {
  return [
    "xenith:billing-gate-seen",
    userId,
    subscription.status,
    subscription.accessExpiresAt ?? "none",
  ].join(":")
}

export function useBillingAccess() {
  const value = useContext(BillingAccessContext)
  if (!value) {
    throw new Error("useBillingAccess must be used within BillingAccessProvider")
  }
  return value
}

export function BillingAccessProvider({
  accessToken,
  userId,
  initialSubscription,
  children,
}: {
  accessToken: string
  userId: string
  initialSubscription: DashboardSubscription
  children: React.ReactNode
}) {
  const router = useRouter()
  const [subscription, setSubscription] =
    useState<DashboardSubscription>(initialSubscription)
  const [modalOpen, setModalOpen] = useState(false)
  const [billingCycle, setBillingCycle] =
    useState<CreatorBillingCycle>(
      initialSubscription.plan === "creator-yearly" ? "yearly" : "monthly",
    )
  const [statusError, setStatusError] = useState<string | null>(
    initialSubscription.available ? null : "Billing status is temporarily unavailable.",
  )
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [submittingPlan, setSubmittingPlan] = useState<BillingPlan | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const checkoutInFlight = useRef(false)

  useEffect(() => {
    setSubscription(initialSubscription)
    setStatusError(
      initialSubscription.available
        ? null
        : "Billing status is temporarily unavailable.",
    )
    if (initialSubscription.plan === "creator-yearly") setBillingCycle("yearly")
    if (initialSubscription.plan === "creator") setBillingCycle("monthly")
  }, [initialSubscription])

  useEffect(() => {
    if (!subscription.available || subscription.hasAccess) return

    const key = unpaidEpisodeKey(userId, subscription)
    try {
      if (window.localStorage.getItem(key) === "true") return
      window.localStorage.setItem(key, "true")
    } catch {
      // Private browsing and locked-down environments can disable storage. The
      // activation path must still be available even when persistence is not.
    }

    setModalOpen(true)
  }, [subscription, userId])

  useEffect(() => {
    if (subscription.hasAccess) setModalOpen(false)
  }, [subscription.hasAccess])

  const refreshBillingStatus = useCallback(async () => {
    setCheckingStatus(true)
    setStatusError(null)
    const result = await fetchBillingStatus(accessToken)
    setCheckingStatus(false)

    if (result.kind === "unauthorized") {
      window.location.assign("/signout")
      return
    }
    if (result.kind === "error") {
      setSubscription((current) => ({ ...current, available: false }))
      setStatusError(result.message)
      return
    }

    const next = subscriptionFromBillingStatus(result.data)
    setSubscription(next)
    if (next.plan === "creator-yearly") setBillingCycle("yearly")
    if (next.plan === "creator") setBillingCycle("monthly")
    if (next.hasAccess) setModalOpen(false)
    router.refresh()
  }, [accessToken, router])

  useEffect(() => {
    const handleSubscriptionRequired = () => {
      setSubscription((current) => ({
        ...current,
        hasAccess: false,
      }))
      setModalOpen(true)
      void refreshBillingStatus()
    }
    window.addEventListener(
      SUBSCRIPTION_REQUIRED_EVENT,
      handleSubscriptionRequired,
    )
    return () => {
      window.removeEventListener(
        SUBSCRIPTION_REQUIRED_EVENT,
        handleSubscriptionRequired,
      )
    }
  }, [refreshBillingStatus])

  const subscribeToPlan = useCallback(
    async (plan: BillingPlan) => {
      if (checkoutInFlight.current) return
      checkoutInFlight.current = true
      setSubmittingPlan(plan)

      try {
        const result = await createCheckout(accessToken, plan)

        if (result.kind === "unauthorized") {
          window.location.assign("/signout")
          return
        }
        if (result.kind === "resumed") {
          const next = subscriptionFromBillingStatus(result.data)
          setSubscription(next)
          setModalOpen(false)
          toast.success("Subscription resumed", {
            description: "Your Creator access will continue.",
          })
          router.refresh()
          return
        }
        if (result.kind === "conflict") {
          await refreshBillingStatus()
          toast.error(
            result.code === "SUBSCRIPTION_ON_HOLD"
              ? "Update your payment method to restore this subscription."
              : "This subscription is already using another billing cycle.",
          )
          return
        }
        if (result.kind === "error") {
          toast.error(result.message)
          return
        }

        window.location.assign(result.checkoutUrl)
      } finally {
        checkoutInFlight.current = false
        setSubmittingPlan(null)
      }
    },
    [accessToken, refreshBillingStatus, router],
  )

  const openBillingPortal = useCallback(async () => {
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

  const value = useMemo<BillingAccessContextValue>(
    () => {
      const openBillingModal = () => setModalOpen(true)
      return {
        subscription,
        statusError,
        checkingStatus,
        submittingPlan,
        openingPortal,
        openBillingModal,
        requirePaidAccess: () => {
          if (subscription.hasAccess) return true
          openBillingModal()
          return false
        },
        refreshBillingStatus,
        subscribeToPlan,
        openBillingPortal,
      }
    },
    [
      checkingStatus,
      openBillingPortal,
      openingPortal,
      refreshBillingStatus,
      statusError,
      submittingPlan,
      subscribeToPlan,
      subscription,
    ],
  )

  return (
    <BillingAccessContext.Provider value={value}>
      {children}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto p-0">
          <DialogClose
            aria-label="Close subscription dialog"
            className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <IconX className="size-4" />
          </DialogClose>
          <BillingModalContent
            subscription={subscription}
            statusError={statusError}
            checkingStatus={checkingStatus}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            submittingPlan={submittingPlan}
            openingPortal={openingPortal}
            onSubscribe={subscribeToPlan}
            onRefresh={refreshBillingStatus}
            onOpenPortal={openBillingPortal}
          />
        </DialogContent>
      </Dialog>
    </BillingAccessContext.Provider>
  )
}

function BillingModalContent({
  subscription,
  statusError,
  checkingStatus,
  billingCycle,
  onBillingCycleChange,
  submittingPlan,
  openingPortal,
  onSubscribe,
  onRefresh,
  onOpenPortal,
}: {
  subscription: DashboardSubscription
  statusError: string | null
  checkingStatus: boolean
  billingCycle: CreatorBillingCycle
  onBillingCycleChange: (cycle: CreatorBillingCycle) => void
  submittingPlan: BillingPlan | null
  openingPortal: boolean
  onSubscribe: (plan: BillingPlan) => Promise<void>
  onRefresh: () => Promise<void>
  onOpenPortal: () => Promise<void>
}) {
  if (!subscription.available) {
    return (
      <BillingStatePanel
        icon={<IconAlertCircle className="size-8 text-destructive" />}
        title="We couldn't check your subscription"
        description={statusError ?? "Your saved content is still available. Check again to restore billing actions."}
      >
        <Button onClick={() => void onRefresh()} disabled={checkingStatus}>
          {checkingStatus ? (
            <IconLoader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <IconRefresh data-icon="inline-start" />
          )}
          {checkingStatus ? "Checking…" : "Check again"}
        </Button>
      </BillingStatePanel>
    )
  }

  if (subscription.status === "on_hold") {
    return (
      <BillingStatePanel
        icon={<IconCreditCard className="size-8 text-destructive" />}
        title="Update your payment method"
        description="Your subscription is on hold. Update the payment method for this subscription instead of starting another plan."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void onOpenPortal()} disabled={openingPortal}>
            {openingPortal && (
              <IconLoader2 data-icon="inline-start" className="animate-spin" />
            )}
            {openingPortal ? "Opening billing…" : "Update payment method"}
          </Button>
          <Button variant="outline" onClick={() => void onRefresh()} disabled={checkingStatus}>
            <IconRefresh data-icon="inline-start" className={checkingStatus ? "animate-spin" : undefined} />
            {checkingStatus ? "Checking…" : "Check again"}
          </Button>
        </div>
      </BillingStatePanel>
    )
  }

  if (subscription.status === "pending" || subscription.status === "processing") {
    return (
      <BillingStatePanel
        icon={<IconLoader2 className="size-8 animate-spin text-primary" />}
        title="Your subscription is activating"
        description="Payment is still being confirmed. Check again shortly—starting another checkout could create a duplicate subscription."
      >
        <Button variant="outline" onClick={() => void onRefresh()} disabled={checkingStatus}>
          <IconRefresh data-icon="inline-start" className={checkingStatus ? "animate-spin" : undefined} />
          {checkingStatus ? "Checking…" : "Check again"}
        </Button>
      </BillingStatePanel>
    )
  }

  const isNew = subscription.status === "free"
  const title = isNew
    ? "Your workspace is ready"
    : subscription.status === "failed"
      ? "Restore Creator access"
      : "Reactivate your workspace"
  const description = isNew
    ? "Start your trial to generate posts, schedule content, and create suggested replies."
    : "Your saved posts and replies remain available. Reactivate to create, edit, publish, and schedule again."

  return (
    <div className="grid gap-5 p-5 sm:p-6">
      <DialogHeader className="pr-10 text-left">
        <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <CreatorPlanCard
        billing={billingCycle}
        onBillingChange={onBillingCycleChange}
        submittingPlan={submittingPlan}
        onSubscribe={onSubscribe}
        ctaLabel={isNew ? "Start 3-day free trial" : "Continue to checkout"}
        showTrialTerms={isNew}
      />
    </div>
  )
}

function BillingStatePanel({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-80 flex-col justify-center gap-6 p-6 sm:p-8">
      <DialogHeader className="pr-10 text-left">
        {icon}
        <DialogTitle className="mt-2 text-xl sm:text-2xl">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div>{children}</div>
    </div>
  )
}
