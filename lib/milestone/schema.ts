import { z } from "zod"
import { normalizeHandle, parseFollowerCount } from "./formatters"

const handlePattern = /^[A-Za-z0-9_]{1,15}$/

export const milestoneInputSchema = z.object({
  handle: z.string().transform(normalizeHandle).refine((value) => handlePattern.test(value), {
    message: "Use 1–15 letters, numbers, or underscores.",
  }),
  followerCount: z.number().int().min(1).max(999_999_999),
  orientation: z.enum(["portrait", "landscape"]),
})

export function validateHandle(value: string): string | null {
  return handlePattern.test(normalizeHandle(value)) ? null : "Use 1–15 letters, numbers, or underscores."
}

export function validateFollowerCount(value: string): string | null {
  return parseFollowerCount(value) === null ? "Enter a follower milestone such as 10K or 10,000." : null
}
