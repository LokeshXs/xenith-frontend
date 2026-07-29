"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  IconAlertCircle,
  IconCircleCheck,
  IconRefresh,
} from "@tabler/icons-react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import {
  fetchBillingStatus,
  postAuthAppRoute,
} from "@/lib/services/billing"
import { XenithMark } from "@/components/brand/xenith-logo"
import { Button } from "@/components/ui/button"
import { TextShimmer } from "@/components/ui/text-shimmer"

const POLL_INTERVAL_MS = 1_500
const POLL_TIMEOUT_MS = 15_000

const EASE_OUT = [0.23, 1, 0.32, 1] as const

type ActivationState = "checking" | "pending" | "error"

export default function BillingSuccessPage() {
  const { session, isLoading } = useAuth()
  const accessToken = session?.access_token ?? null
  const [state, setState] = useState<ActivationState>("checking")
  const [error, setError] = useState<string | null>(null)
  const pollRun = useRef(0)
  const activationNotified = useRef(false)
  const reduceMotion = useReducedMotion()

  const goToApp = useCallback(async () => {
    if (!accessToken) {
      window.location.assign("/login?redirectTo=%2Fbilling%2Fsuccess")
      return
    }
    window.location.assign(await postAuthAppRoute(accessToken))
  }, [accessToken])

  const poll = useCallback(async () => {
    if (!accessToken) return

    const run = ++pollRun.current
    const startedAt = Date.now()
    setState("checking")
    setError(null)

    while (pollRun.current === run) {
      const result = await fetchBillingStatus(accessToken)

      if (result.kind === "unauthorized") {
        window.location.assign("/login?redirectTo=%2Fbilling%2Fsuccess")
        return
      }

      if (result.kind === "error") {
        setError(result.message)
        setState("error")
        return
      }

      if (result.data.has_access) {
        if (!activationNotified.current) {
          activationNotified.current = true
          toast.success("Subscription activated", {
            description: "Your Creator access is now active.",
          })
          await new Promise((resolve) => window.setTimeout(resolve, 900))
        }
        await goToApp()
        return
      }

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setState("pending")
        return
      }

      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }, [accessToken, goToApp])

  useEffect(() => {
    if (isLoading) return
    if (!accessToken) {
      window.location.replace("/login?redirectTo=%2Fbilling%2Fsuccess")
      return
    }

    const timer = window.setTimeout(() => {
      void poll()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      pollRun.current += 1
    }
  }, [accessToken, isLoading, poll])

  const checking = isLoading || state === "checking"

  // Movement is dropped under reduced-motion; only opacity remains.
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.06 },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: EASE_OUT },
    },
  }

  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      {/* Soft radial backdrop — decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--muted)_0%,transparent_70%)]"
      />

      {checking ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex flex-col items-center"
        >
          <div className="relative grid size-28 place-items-center">
            <span
              aria-hidden
              className="analyze-glow absolute -inset-2 rounded-full bg-primary/30 blur-2xl"
            />
            <span
              aria-hidden
              className="analyze-ripple absolute size-16 rounded-full border border-primary/40"
            />
            <span
              aria-hidden
              className="analyze-ripple absolute size-16 rounded-full border border-primary/40 [animation-delay:-1.3s]"
            />
            <XenithMark variant="tile" className="relative size-14" />
          </div>
          <TextShimmer
            as="p"
            duration={1.6}
            spread={1.5}
            className="mt-6 text-sm font-medium tracking-tight text-muted-foreground"
          >
            Activating your subscription…
          </TextShimmer>
        </div>
      ) : (
        <motion.div
          key={state}
          variants={container}
          initial="hidden"
          animate="show"
          className="flex w-full flex-col items-center"
        >
          <motion.div variants={item}>
            {state === "pending" ? (
              <div className="analyze-badge-in grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_-8px_var(--primary)]">
                <IconCircleCheck className="size-7" />
              </div>
            ) : (
              <div className="grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
                <IconAlertCircle className="size-7" />
              </div>
            )}
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-2xl font-semibold tracking-tight text-foreground"
          >
            {state === "pending"
              ? "Payment received"
              : "We couldn’t confirm activation"}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-2 max-w-sm text-sm text-muted-foreground"
          >
            {state === "pending"
              ? "Dodo is still confirming your subscription. Your access will appear as soon as the confirmation arrives."
              : error ?? "Please retry the status check."}
          </motion.p>

          <motion.p
            variants={item}
            className="mt-4 max-w-sm text-xs text-muted-foreground"
          >
            {state === "pending"
              ? "Access is granted only after the verified payment webhook is processed."
              : "If any amount was deducted, it will be refunded to your payment method."}
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex w-full max-w-xs flex-col gap-2"
          >
            <Button className="w-full" onClick={() => void poll()}>
              <IconRefresh data-icon="inline-start" />
              Check again
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => void goToApp()}
            >
              Continue to app
            </Button>
          </motion.div>
        </motion.div>
      )}
    </main>
  )
}
