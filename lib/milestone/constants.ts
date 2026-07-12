import type { MilestoneInput, Orientation } from "@/types/milestone"

export const MILESTONE_VIDEO = {
  id: "milestone",
  fps: 30,
  durationInFrames: 240,
  finalPosterFrame: 214,
} as const

export const MILESTONE_ORIENTATIONS = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
} as const

export function getMilestoneDimensions(orientation: Orientation) {
  return MILESTONE_ORIENTATIONS[orientation]
}

export const DEFAULT_MILESTONE_INPUT: MilestoneInput = {
  handle: "creator",
  followerCount: 10_000,
  orientation: "portrait",
}
