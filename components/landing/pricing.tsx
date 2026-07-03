"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { toast } from "sonner"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  createCheckout,
  isBillingPlan,
  loginForCheckout,
  postAuthAppRoute,
  type BillingPlan,
} from "@/lib/services/billing"
import {
  CreatorPlanCard,
  type CreatorBillingCycle,
} from "@/components/billing/creator-plan-card"

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function Pricing() {
  const [billing, setBilling] = useState<CreatorBillingCycle>("monthly")
  const [submittingPlan, setSubmittingPlan] = useState<BillingPlan | null>(null)
  const checkoutInFlight = useRef(false)
  const resumedIntent = useRef(false)
  const reduceMotion = useReducedMotion()

  const subscribe = useCallback(async (plan: BillingPlan) => {
    if (checkoutInFlight.current) return
    checkoutInFlight.current = true
    setSubmittingPlan(plan)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.location.assign(loginForCheckout(plan))
        return
      }

      const result = await createCheckout(session.access_token, plan)

      if (result.kind === "unauthorized") {
        window.location.assign(loginForCheckout(plan))
        return
      }

      if (result.kind === "conflict") {
        window.location.assign(await postAuthAppRoute(session.access_token))
        return
      }

      if (result.kind === "resumed") {
        toast.success("Subscription resumed", {
          description: "Your Creator access will continue.",
        })
        window.location.assign(await postAuthAppRoute(session.access_token))
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
  }, [])

  useEffect(() => {
    if (resumedIntent.current) return

    const url = new URL(window.location.href)
    const checkout = url.searchParams.get("checkout")
    if (!isBillingPlan(checkout)) return

    resumedIntent.current = true
    window.setTimeout(() => {
      setBilling(checkout === "creator-yearly" ? "yearly" : "monthly")
    }, 0)
    url.searchParams.delete("checkout")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    void subscribe(checkout)
  }, [subscribe])

  // Staggered scroll reveal matching the landing page's other sections.
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.04 },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.55, ease: EASE_OUT },
    },
  }

  return (
    <section id="pricing" className="container mx-auto px-4 py-14 sm:px-12 sm:py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={container}
      >
        <motion.div
          variants={container}
          className="mx-auto max-w-xl"
        >
          <motion.div variants={item}>
            <CreatorPlanCard
              billing={billing}
              onBillingChange={setBilling}
              onSubscribe={subscribe}
              submittingPlan={submittingPlan}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
