"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { IconCheck, IconHelpCircle, IconLoader2 } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { CREATOR_PRICING } from "@/lib/pricing"
import type { BillingPlan } from "@/lib/services/billing"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const EASE_OUT = [0.23, 1, 0.32, 1] as const

const CREATOR_PLAN = {
  name: "Creator",
  monthly: CREATOR_PRICING.monthly,
  yearly: CREATOR_PRICING.yearly,
  blurb: "Everything you need to create consistently and grow on X.",
  features: [
    { label: "10 post drafts per day" },
    {
      label: "1,000 reply credits",
      tooltip:
        "Use your 1,000 credits to catch high-traction posts early with suggested replies.",
    },
    { label: "Schedule as many posts as you want" },
    {
      label: "Track across 10 X profiles",
      tooltip:
        "Analyze up to 10 X profiles for inspiration, then generate posts influenced by their writing patterns while preserving your own voice.",
    },
    {
      label: "X algorithm-based analytics",
      tooltip:
        "Xenith analyzes each post draft with X algorithm signals to estimate likely likes, reposts, replies, and other engagement metrics.",
    },
  ],
} as const

function getSavingsPercent(monthlyPrice: number, yearlyMonthlyPrice: number) {
  if (monthlyPrice <= 0 || yearlyMonthlyPrice >= monthlyPrice) return 0

  return Math.round(((monthlyPrice - yearlyMonthlyPrice) / monthlyPrice) * 100)
}

export type CreatorBillingCycle = "monthly" | "yearly"

export function billingPlanForCycle(cycle: CreatorBillingCycle): BillingPlan {
  return cycle === "monthly" ? "creator" : "creator-yearly"
}

export function CreatorPlanCard({
  billing,
  onBillingChange,
  submittingPlan,
  onSubscribe,
}: {
  billing: CreatorBillingCycle
  onBillingChange: (billing: CreatorBillingCycle) => void
  submittingPlan: BillingPlan | null
  onSubscribe: (plan: BillingPlan) => Promise<void>
}) {
  const reduceMotion = useReducedMotion()
  const price =
    billing === "monthly" ? CREATOR_PLAN.monthly : CREATOR_PLAN.yearly
  const yearlySavingsPercent = getSavingsPercent(
    CREATOR_PLAN.monthly,
    CREATOR_PLAN.yearly,
  )
  const selectedPlan = billingPlanForCycle(billing)
  const isSubmitting = submittingPlan === selectedPlan

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <BillingToggle billing={billing} onChange={onBillingChange} />
      </div>

      <Card className="h-full sm:gap-8 sm:py-8">
        <CardHeader className="sm:px-8">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {CREATOR_PLAN.name}
          </CardTitle>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="relative inline-flex items-baseline overflow-hidden text-3xl font-semibold tracking-tight sm:text-5xl">
              $
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={price}
                  initial={reduceMotion ? false : { y: "0.5em", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { y: "-0.5em", opacity: 0 }
                  }
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="inline-block tabular-nums"
                >
                  {price}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
          {billing === "yearly" && (
            <p className="text-xs text-muted-foreground">
              Billed annually
              {yearlySavingsPercent > 0 && ` · Save ${yearlySavingsPercent}%`}
            </p>
          )}

          <CardDescription className="mt-2">
            {CREATOR_PLAN.blurb}
          </CardDescription>
        </CardHeader>

        <CardContent className="sm:px-8">
          <ul className="flex flex-col gap-3.5">
            {CREATOR_PLAN.features.map((feature) => (
              <li
                key={feature.label}
                className="flex items-start gap-2.5 text-sm"
              >
                <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="inline-flex items-center gap-1.5">
                  {feature.label}
                  {"tooltip" in feature && feature.tooltip && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                          aria-label={`More information about ${feature.label}`}
                        >
                          <IconHelpCircle className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64 text-left leading-snug">
                          {feature.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="mt-auto flex-col sm:px-8">
          <Button
            size="lg"
            className="w-full"
            disabled={submittingPlan !== null}
            onClick={() => void onSubscribe(selectedPlan)}
          >
            {isSubmitting && (
              <IconLoader2 data-icon="inline-start" className="animate-spin" />
            )}
            {isSubmitting ? "Opening checkout…" : "Subscribe now"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Cancel anytime
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function BillingToggle({
  billing,
  onChange,
}: {
  billing: CreatorBillingCycle
  onChange: (billing: CreatorBillingCycle) => void
}) {
  const yearlySavingsPercent = getSavingsPercent(
    CREATOR_PLAN.monthly,
    CREATOR_PLAN.yearly,
  )

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-muted/60 p-1 text-sm">
      <ToggleButton
        active={billing === "monthly"}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </ToggleButton>
      <ToggleButton
        active={billing === "yearly"}
        onClick={() => onChange("yearly")}
      >
        Yearly
        {yearlySavingsPercent > 0 && (
          <span
            className={cn(
              "ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold sm:text-sm",
              billing === "yearly"
                ? "bg-primary/15 text-primary"
                : "bg-foreground/10 text-muted-foreground",
            )}
          >
            -{yearlySavingsPercent}%
          </span>
        )}
      </ToggleButton>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative inline-flex items-center rounded-full px-4 py-1.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        active && reduceMotion && "bg-card shadow-sm",
      )}
    >
      {active && !reduceMotion && (
        <motion.span
          layoutId="creator-billing-pill"
          className="absolute inset-0 rounded-full bg-card shadow-sm"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center">{children}</span>
    </button>
  )
}
