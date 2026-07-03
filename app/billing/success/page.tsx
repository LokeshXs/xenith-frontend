"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  IconAlertCircle,
  IconCircleCheck,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { useAuth } from "@/context/AuthContext"
import {
  fetchBillingStatus,
  postAuthAppRoute,
} from "@/lib/services/billing"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const POLL_INTERVAL_MS = 1_500
const POLL_TIMEOUT_MS = 15_000

type ActivationState = "checking" | "pending" | "error"

export default function BillingSuccessPage() {
  const { session, isLoading } = useAuth()
  const accessToken = session?.access_token ?? null
  const [state, setState] = useState<ActivationState>("checking")
  const [error, setError] = useState<string | null>(null)
  const pollRun = useRef(0)
  const activationNotified = useRef(false)

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

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          {checking ? (
            <IconLoader2 className="size-9 animate-spin text-primary text-center" aria-hidden />
          ) : state === "pending" ? (
            <IconCircleCheck className="size-9 text-primary text-center" aria-hidden />
          ) : (
            <IconAlertCircle className="size-9 text-destructive text-center" aria-hidden />
          )}
          <CardTitle className="mt-2 text-xl">
            {checking
              ? "Activating your subscription"
              : state === "pending"
                ? "Payment received"
                : "We couldn’t confirm activation"}
          </CardTitle>
          <CardDescription>
            {checking
              ? "This usually takes only a few seconds."
              : state === "pending"
                ? "Dodo is still confirming your subscription. Your access will appear as soon as the confirmation arrives."
                : error ?? "Please retry the status check."}
          </CardDescription>
        </CardHeader>

        {!checking && (
          <>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Access is granted only after the verified payment webhook is processed.
              </p>
            </CardContent>
            <CardFooter className="flex-col gap-2">
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
            </CardFooter>
          </>
        )}
      </Card>
    </main>
  )
}
