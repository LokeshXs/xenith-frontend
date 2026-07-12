"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { getExportCapability } from "@/lib/milestone/capability"
import { downloadBlob } from "@/lib/milestone/export"
import { formatFollowerCount, milestoneFilename, parseFollowerCount } from "@/lib/milestone/formatters"
import { MILESTONE_VIDEO } from "@/lib/milestone/constants"
import { milestoneInputSchema, validateFollowerCount, validateHandle } from "@/lib/milestone/schema"
import { siteConfig } from "@/lib/seo/config"
import type { ExportCapability, ExportState, MilestoneDraft, MilestoneInput, MilestoneResult, Orientation, OutputType } from "@/types/milestone"
import { getMilestoneComposition } from "@/video/composition-config"
import { MilestoneWizard, WIZARD_STEP_COUNT } from "./milestone-wizard"

type FieldErrors = Partial<Record<"handle" | "followerCount", string>>

const INITIAL_DRAFT: MilestoneDraft = {
  handle: "",
  followerCount: "",
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function MilestoneGenerator() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<MilestoneDraft>(INITIAL_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [outputType, setOutputType] = useState<OutputType>("video")
  const [orientation, setOrientation] = useState<Orientation>("portrait")
  const [capability, setCapability] = useState<ExportCapability | null>(null)
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" })
  const [result, setResult] = useState<MilestoneResult | null>(null)
  const abortController = useRef<AbortController | null>(null)
  const resultUrl = useRef<string | null>(null)

  function revokeResultUrl() {
    if (resultUrl.current) {
      URL.revokeObjectURL(resultUrl.current)
      resultUrl.current = null
    }
  }

  function publishResult(blob: Blob, filename: string, kind: MilestoneResult["kind"]) {
    revokeResultUrl()
    const url = URL.createObjectURL(blob)
    resultUrl.current = url
    setResult({ url, blob, filename, kind })
  }

  useEffect(() => {
    void getExportCapability()
      .then(setCapability)
      .catch(() => {
        setCapability({
          canRenderVideo: false,
          preferredFormat: null,
          supportsMp4: false,
          supportsWebm: false,
          reason: "We could not check browser video support. You can still create a still image.",
        })
      })
  }, [])

  useEffect(() => {
    return () => {
      abortController.current?.abort()
      revokeResultUrl()
    }
  }, [])

  const busy = exportState.status === "checking" || exportState.status === "rendering" || exportState.status === "exporting-image"

  function clearExportResult() {
    if (exportState.status === "error" || exportState.status === "complete") setExportState({ status: "idle" })
    if (result) {
      revokeResultUrl()
      setResult(null)
    }
  }

  function updateDraft(field: "handle" | "followerCount", value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    clearExportResult()
  }

  function handleNext() {
    if (step === 0) {
      const message = validateHandle(draft.handle)
      if (message) {
        setErrors((current) => ({ ...current, handle: message }))
        return
      }
    }
    if (step === 1) {
      const message = validateFollowerCount(draft.followerCount)
      if (message) {
        setErrors((current) => ({ ...current, followerCount: message }))
        return
      }
    }
    setStep((current) => Math.min(WIZARD_STEP_COUNT - 1, current + 1))
  }

  function handleBack() {
    clearExportResult()
    setStep((current) => Math.max(0, current - 1))
  }

  function handleReset() {
    revokeResultUrl()
    setResult(null)
    setExportState({ status: "idle" })
    setStep(0)
  }

  function getValidInput(): MilestoneInput | null {
    const parsed = milestoneInputSchema.safeParse({
      handle: draft.handle,
      followerCount: parseFollowerCount(draft.followerCount),
      orientation,
    })

    if (!parsed.success) {
      setExportState({ status: "error", message: "Check your details and try again." })
      return null
    }

    return parsed.data
  }

  async function createImage(input: MilestoneInput) {
    setExportState({ status: "exporting-image" })
    try {
      const { renderStillOnWeb } = await import("@remotion/web-renderer")
      const rendered = await renderStillOnWeb({
        composition: getMilestoneComposition(input.orientation),
        inputProps: input,
        frame: MILESTONE_VIDEO.finalPosterFrame,
        allowHtmlInCanvas: true,
      })
      const blob = await rendered.blob({ format: "png" })
      publishResult(blob, milestoneFilename(input.handle, input.followerCount, "png"), "image")
      setExportState({ status: "complete", message: "Your image is ready." })
      toast.success("Image ready")
    } catch (error) {
      console.error("Failed to export image", error)
      setExportState({ status: "error", message: "We could not create the image. Please try again." })
    }
  }

  async function createVideo(input: MilestoneInput) {
    setExportState({ status: "checking" })
    try {
      const currentCapability = capability ?? (await getExportCapability())
      setCapability(currentCapability)
      if (!currentCapability.canRenderVideo || !currentCapability.preferredFormat) {
        setExportState({ status: "error", message: currentCapability.reason ?? "This browser cannot create a video locally." })
        return
      }

      const controller = new AbortController()
      abortController.current = controller
      const format = currentCapability.preferredFormat
      setExportState({ status: "rendering", format, progress: 0 })

      const { renderMediaOnWeb } = await import("@remotion/web-renderer")
      const rendered = await renderMediaOnWeb({
        composition: getMilestoneComposition(input.orientation),
        inputProps: input,
        container: format,
        videoCodec: format === "mp4" ? "h264" : "vp8",
        muted: true,
        videoBitrate: 3_500_000,
        hardwareAcceleration: "prefer-hardware",
        keyframeIntervalInSeconds: 2,
        pageResponsiveness: "medium",
        allowHtmlInCanvas: true,
        signal: controller.signal,
        onProgress: (progress) => setExportState({ status: "rendering", format, progress: progress.progress }),
      })
      const blob = await rendered.getBlob()
      publishResult(blob, milestoneFilename(input.handle, input.followerCount, format), "video")
      setExportState({ status: "complete", message: `Your ${format.toUpperCase()} video is ready.` })
      toast.success(`${format.toUpperCase()} video ready`)
    } catch (error) {
      if (isAbortError(error)) {
        setExportState({ status: "idle" })
        toast.message("Video export cancelled")
      } else {
        console.error("Failed to export video", error)
        setExportState({ status: "error", message: "We could not create the video. Keep this tab open and try again." })
      }
    } finally {
      abortController.current = null
    }
  }

  function handleRender() {
    if (busy) return
    const input = getValidInput()
    if (!input) return
    if (outputType === "image") {
      void createImage(input)
    } else {
      void createVideo(input)
    }
  }

  function cancelExport() {
    abortController.current?.abort()
  }

  function downloadResult() {
    if (!result) return
    downloadBlob(result.blob, result.filename)
  }

  async function shareResult() {
    if (!result) return
    const count = parseFollowerCount(draft.followerCount)
    const text = count !== null
      ? `I just hit ${formatFollowerCount(count)} followers on X 🎉`
      : "I just hit a new follower milestone on X 🎉"
    const shareUrl = `${siteConfig.url}/milestone`

    const file = new File([result.blob], result.filename, { type: result.blob.type })
    const canShareFile = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })

    if (canShareFile) {
      try {
        await navigator.share({ files: [file], text })
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Failed to share milestone", error)
          toast.error("Sharing failed. You can download and post it manually.")
        }
      }
      return
    }

    // Desktop fallback: open X's composer prefilled, and download the file to attach.
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(intent, "_blank", "noopener,noreferrer")
    downloadBlob(result.blob, result.filename)
    toast.message("Attach the downloaded file to your post on X")
  }

  return (
    <section
      id="create"
      className="relative flex flex-col items-center overflow-hidden bg-background px-5 py-16 sm:py-24"
    >
      {/* Soft background photo, edge-faded to white — mirrors the landing CTA. */}
      <div aria-hidden className="absolute inset-0 z-0">
        <Image
          src="/background.png"
          alt=""
          fill
          className="object-cover opacity-30 object-bottom mask-t-from-45% mask-b-from-92%"
        />
      </div>
      {/* White spotlight — keeps the center clean so the wizard reads clearly; the photo shows toward the edges/bottom. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(52%_60%_at_50%_42%,var(--background)_28%,var(--background)_42%,transparent_78%)]"
      />

      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Milestone maker</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Create your milestone
          </h2>
        </div>
        <div className="flex w-full items-center justify-center pt-12">
          <MilestoneWizard
            step={step}
            draft={draft}
            errors={errors}
            outputType={outputType}
            orientation={orientation}
            capability={capability}
            exportState={exportState}
            result={result}
            busy={busy}
            onChange={updateDraft}
            onNext={handleNext}
            onBack={handleBack}
            onSelectOutputType={setOutputType}
            onSelectOrientation={setOrientation}
            onRender={handleRender}
            onCancel={cancelExport}
            onReset={handleReset}
            onShare={shareResult}
            onDownload={downloadResult}
          />
        </div>
      </div>
    </section>
  )
}
