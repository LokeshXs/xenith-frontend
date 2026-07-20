/**
 * Single source of truth for the Creator plan price. Reused by the pricing UI
 * (creator-plan-card) and the SoftwareApplication JSON-LD on the landing page
 * so the price in structured data can never drift from the price on screen —
 * a mismatch triggers Google structured-data errors.
 */
export const CREATOR_PRICING = {
  currency: "USD",
  monthly: 24,
  yearly: 20,
} as const
