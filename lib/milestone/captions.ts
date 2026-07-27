import { formatMilestoneCount } from "./formatters"
import type { MilestoneNumberFormat } from "@/types/milestone"

export type MilestoneCaptionStyle = "grateful" | "celebratory" | "concise"

export type MilestoneCaptions = Record<MilestoneCaptionStyle, string>

export function createMilestoneCaptions(
  count: number,
  numberFormat: MilestoneNumberFormat,
): MilestoneCaptions {
  const formattedCount = formatMilestoneCount(count, numberFormat)

  return {
    grateful: `I just reached ${formattedCount} followers on X. Grateful for every follow, reply, and conversation along the way. Thank you for being here. 💜`,
    celebratory: `${formattedCount} followers on X! 🎉 This community keeps getting better. Onward to the next milestone.`,
    concise: `${formattedCount} followers. Thank you for being part of the journey. 🚀`,
  }
}
