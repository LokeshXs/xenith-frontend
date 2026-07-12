import { z } from "zod"
import { DEFAULT_MILESTONE_INPUT, MILESTONE_ORIENTATIONS, MILESTONE_VIDEO } from "../lib/milestone/constants"
import type { Orientation } from "../types/milestone"
import { MilestoneComposition } from "./milestone-composition"

export const milestonePropsSchema = z.object({
  handle: z.string(),
  followerCount: z.number(),
  orientation: z.enum(["portrait", "landscape"]),
})

export type MilestoneCompositionProps = z.infer<typeof milestonePropsSchema>

export function getMilestoneComposition(orientation: Orientation) {
  const { width, height } = MILESTONE_ORIENTATIONS[orientation]
  return {
    id: `${MILESTONE_VIDEO.id}-${orientation}`,
    component: MilestoneComposition,
    width,
    height,
    fps: MILESTONE_VIDEO.fps,
    durationInFrames: MILESTONE_VIDEO.durationInFrames,
    schema: milestonePropsSchema,
    defaultProps: { ...DEFAULT_MILESTONE_INPUT, orientation },
  }
}

export const milestoneComposition = getMilestoneComposition("portrait")
