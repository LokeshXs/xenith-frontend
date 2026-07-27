export type Orientation = "portrait" | "square" | "landscape"

export type OutputType = "image" | "video"

export type MilestoneNumberFormat = "full" | "compact"

export type MilestoneImageTreatment = "photo" | "logo"

export type MilestoneProfileImage = {
  dataUrl: string
  filename: string
  treatment: MilestoneImageTreatment
}

export type MilestoneInput = {
  handle: string
  followerCount: number
  orientation: Orientation
  numberFormat: MilestoneNumberFormat
  profileImageDataUrl: string | null
  imageTreatment: MilestoneImageTreatment
}

export type MilestoneDraft = {
  handle: string
  followerCount: string
}

export type VideoExportFormat = "mp4" | "webm"

export type ExportCapability = {
  canRenderVideo: boolean
  preferredFormat: VideoExportFormat | null
  supportsMp4: boolean
  supportsWebm: boolean
  reason: string | null
}

export type ExportState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "rendering"; format: VideoExportFormat; progress: number }
  | { status: "exporting-image" }
  | { status: "complete"; message: string }
  | { status: "error"; message: string }

export type MilestoneResult = {
  url: string
  blob: Blob
  filename: string
  kind: "image" | "video"
}
