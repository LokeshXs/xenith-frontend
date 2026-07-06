export const BILLING_PLANS = ["creator", "creator-yearly"] as const

export type BillingPlan = (typeof BILLING_PLANS)[number]
export type BillingSubscriptionStatus =
  | "free"
  | "pending"
  | "active"
  | "on_hold"
  | "cancelled"
  | "expired"
  | "failed"
export type ReplyCount = 5 | 10

export type ReplyCreditSummary = {
  balance: number
  period_granted: number
  period_used: number
  credits_per_reply: number
  default_reply_count: ReplyCount
  allowed_reply_counts: ReplyCount[]
  period_started_at: string | null
  period_ends_at: string | null
}

export type BillingStatus = {
  plan: BillingPlan | null
  status: BillingSubscriptionStatus
  has_access: boolean
  cancel_at_period_end: boolean
  next_billing_date: string | null
  access_expires_at: string | null
  trial_ends_at: string | null
  is_trialing: boolean
  trial_days_remaining: number | null
  reply_credits: ReplyCreditSummary
}

export type CheckoutResult =
  | { kind: "ok"; checkoutUrl: string; trialApplied: boolean }
  | { kind: "resumed"; data: BillingStatus }
  | { kind: "unauthorized" }
  | { kind: "conflict" }
  | { kind: "error"; message: string }

export type BillingStatusResult =
  | { kind: "ok"; data: BillingStatus }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }

export type CancelSubscriptionResult =
  | { kind: "ok"; data: BillingStatus }
  | { kind: "unauthorized" }
  | { kind: "conflict"; message: string }
  | { kind: "error"; message: string }

function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured")
  return `${baseUrl}${path}`
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? fallback
  } catch {
    return fallback
  }
}

export function isBillingPlan(value: string | null): value is BillingPlan {
  return BILLING_PLANS.some((plan) => plan === value)
}

export function checkoutIntentRoute(plan: BillingPlan): string {
  return `/?checkout=${encodeURIComponent(plan)}#pricing`
}

export function loginForCheckout(plan: BillingPlan): string {
  return `/login?redirectTo=${encodeURIComponent(checkoutIntentRoute(plan))}`
}

export async function createCheckout(
  accessToken: string,
  plan: BillingPlan,
): Promise<CheckoutResult> {
  try {
    const response = await fetch(apiUrl("/api/billing/checkout"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    })

    if (response.status === 401) return { kind: "unauthorized" }
    if (response.status === 409) return { kind: "conflict" }
    if (!response.ok) {
      return {
        kind: "error",
        message: await errorMessage(response, "Unable to start checkout"),
      }
    }

    const data = (await response.json()) as {
      checkout_url?: string
      trial_applied?: boolean
      resumed?: boolean
      billing?: BillingStatus
    }
    if (data.resumed) {
      if (!data.billing) {
        return { kind: "error", message: "Subscription was resumed but status was not returned" }
      }
      return { kind: "resumed", data: data.billing }
    }

    if (!data.checkout_url) {
      return { kind: "error", message: "Checkout URL was not returned" }
    }

    return {
      kind: "ok",
      checkoutUrl: data.checkout_url,
      trialApplied: data.trial_applied ?? false,
    }
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Unable to start checkout",
    }
  }
}

export async function fetchBillingStatus(
  accessToken: string,
): Promise<BillingStatusResult> {
  try {
    const response = await fetch(apiUrl("/api/billing/status"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    if (response.status === 401) return { kind: "unauthorized" }
    if (!response.ok) {
      return {
        kind: "error",
        message: await errorMessage(response, "Unable to load billing status"),
      }
    }

    return { kind: "ok", data: (await response.json()) as BillingStatus }
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Unable to load billing status",
    }
  }
}

export async function cancelSubscription(
  accessToken: string,
): Promise<CancelSubscriptionResult> {
  try {
    const response = await fetch(apiUrl("/api/billing/cancel"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ confirmation: "cancel" }),
    })

    if (response.status === 401) return { kind: "unauthorized" }
    if (response.status === 409) {
      return {
        kind: "conflict",
        message: await errorMessage(response, "Subscription cancellation is unavailable"),
      }
    }
    if (!response.ok) {
      return {
        kind: "error",
        message: await errorMessage(response, "Unable to cancel subscription"),
      }
    }

    return { kind: "ok", data: (await response.json()) as BillingStatus }
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Unable to cancel subscription",
    }
  }
}

export async function postAuthAppRoute(accessToken: string): Promise<string> {
  await fetchBillingStatus(accessToken)
  return "/onboarding"
}
