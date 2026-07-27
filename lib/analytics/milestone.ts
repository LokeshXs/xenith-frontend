export type MilestoneAnalyticsValue = string | number | boolean | null
export type MilestoneAnalyticsProperties = Record<string, MilestoneAnalyticsValue>

type UmamiWindow = Window & {
  umami?: {
    track: (eventName: string, properties?: MilestoneAnalyticsProperties) => void
  }
}

export function trackMilestoneEvent(
  eventName: string,
  properties?: MilestoneAnalyticsProperties,
): void {
  if (typeof window === "undefined") return

  try {
    ;(window as UmamiWindow).umami?.track(eventName, properties)
  } catch {
    // Analytics must never interrupt the milestone flow.
  }
}
