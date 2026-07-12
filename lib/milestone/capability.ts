import type { ExportCapability } from "@/types/milestone"
import { MILESTONE_ORIENTATIONS } from "./constants"

export async function getExportCapability(): Promise<ExportCapability> {
  const { canRenderMediaOnWeb } = await import("@remotion/web-renderer")
  const commonOptions = {
    width: MILESTONE_ORIENTATIONS.portrait.width,
    height: MILESTONE_ORIENTATIONS.portrait.height,
    muted: true,
    videoBitrate: 3_500_000,
  } as const

  const mp4 = await canRenderMediaOnWeb({ ...commonOptions, container: "mp4", videoCodec: "h264" })
  const webm = await canRenderMediaOnWeb({ ...commonOptions, container: "webm", videoCodec: "vp8" })

  if (mp4.canRender) {
    return { canRenderVideo: true, preferredFormat: "mp4", supportsMp4: true, supportsWebm: webm.canRender, reason: null }
  }

  if (webm.canRender) {
    return { canRenderVideo: true, preferredFormat: "webm", supportsMp4: false, supportsWebm: true, reason: "MP4 is unavailable on this device, so we’ll create a WebM video instead." }
  }

  const issue = [...mp4.issues, ...webm.issues].find((item) => item.severity === "error")
  return {
    canRenderVideo: false,
    preferredFormat: null,
    supportsMp4: false,
    supportsWebm: false,
    reason: issue?.message ?? "This browser cannot create a video locally. You can still download the poster image.",
  }
}
