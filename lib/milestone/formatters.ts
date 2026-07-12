export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, "").replace(/\s+/g, "")
}

export function parseFollowerCount(value: string): number | null {
  const normalized = value.trim().toLowerCase().replace(/,/g, "")
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([km])?$/)

  if (!match) return null

  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null

  const multiplier = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1
  const count = Math.round(amount * multiplier)

  return count >= 1 && count <= 999_999_999 ? count : null
}

export function formatFollowerCount(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`
  }

  if (value >= 1_000) {
    const thousands = value / 1_000
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`
  }

  return String(value)
}

export function formatFullFollowerCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function milestoneFilename(handle: string, count: number, extension: "mp4" | "webm" | "png"): string {
  const safeHandle = normalizeHandle(handle).toLowerCase().replace(/[^a-z0-9_]/g, "") || "creator"
  return `xenith-milestone-${safeHandle}-${formatFollowerCount(count).toLowerCase()}.${extension}`
}
