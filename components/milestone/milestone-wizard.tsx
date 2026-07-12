"use client"

import type { ReactNode } from "react"
import { IconArrowLeft, IconArrowRight, IconCheck, IconDownload, IconPhoto, IconVideo } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatFollowerCount, parseFollowerCount } from "@/lib/milestone/formatters"
import { cn } from "@/lib/utils"
import type { ExportCapability, ExportState, MilestoneDraft, Orientation, OutputType } from "@/types/milestone"
import { ExportProgress } from "./export-progress"

export const WIZARD_STEP_COUNT = 5

type FieldErrors = Partial<Record<"handle" | "followerCount", string>>

const STEP_META = [
  { title: "What's your handle?", description: "This appears on your milestone." },
  { title: "Which milestone?", description: "The follower count you're celebrating." },
  { title: "Image or video?", description: "Pick what you want to create." },
  { title: "Portrait or landscape?", description: "Choose the orientation for your post." },
  { title: "Create your milestone", description: "Everything renders on your device." },
] as const

export function MilestoneWizard({
  step,
  draft,
  errors,
  outputType,
  orientation,
  capability,
  exportState,
  busy,
  onChange,
  onNext,
  onBack,
  onSelectOutputType,
  onSelectOrientation,
  onRender,
  onCancel,
  onReset,
}: {
  step: number
  draft: MilestoneDraft
  errors: FieldErrors
  outputType: OutputType
  orientation: Orientation
  capability: ExportCapability | null
  exportState: ExportState
  busy: boolean
  onChange: (field: "handle" | "followerCount", value: string) => void
  onNext: () => void
  onBack: () => void
  onSelectOutputType: (value: OutputType) => void
  onSelectOrientation: (value: Orientation) => void
  onRender: () => void
  onCancel: () => void
  onReset: () => void
}) {
  const meta = STEP_META[step]
  const isLastStep = step === WIZARD_STEP_COUNT - 1

  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <StepIndicator step={step} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <div className="min-h-[7rem]">
        {step === 0 && (
          <StepField
            id="handle"
            label="Your X handle"
            value={draft.handle}
            placeholder="@yourhandle"
            error={errors.handle}
            hint="Use your public X username."
            disabled={busy}
            inputMode="text"
            onChange={(value) => onChange("handle", value)}
            onEnter={onNext}
          />
        )}

        {step === 1 && (
          <StepField
            id="follower-count"
            label="Follower milestone"
            value={draft.followerCount}
            placeholder="10K"
            error={errors.followerCount}
            hint="Try 10K, 10,000, or 1.5M."
            disabled={busy}
            inputMode="numeric"
            onChange={(value) => onChange("followerCount", value)}
            onEnter={onNext}
          />
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <SelectableOption
              selected={outputType === "video"}
              onClick={() => onSelectOutputType("video")}
              icon={<IconVideo aria-hidden />}
              title="Animated video"
              description="A short MP4 with the number rolling up."
            />
            <SelectableOption
              selected={outputType === "image"}
              onClick={() => onSelectOutputType("image")}
              icon={<IconPhoto aria-hidden />}
              title="Still image"
              description="A single PNG poster of your milestone."
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <SelectableOption
              selected={orientation === "portrait"}
              onClick={() => onSelectOrientation("portrait")}
              icon={<span className="block h-6 w-4 rounded-sm bg-current" />}
              title="Portrait"
              description="1080 × 1920 — Stories, Reels, Shorts."
            />
            <SelectableOption
              selected={orientation === "landscape"}
              onClick={() => onSelectOrientation("landscape")}
              icon={<span className="block h-4 w-6 rounded-sm bg-current" />}
              title="Landscape"
              description="1920 × 1080 — X, YouTube, feeds."
            />
          </div>
        )}

        {step === 4 && (
          <CreateStep
            draft={draft}
            outputType={outputType}
            orientation={orientation}
            capability={capability}
            exportState={exportState}
            busy={busy}
            onRender={onRender}
            onCancel={onCancel}
            onReset={onReset}
          />
        )}
      </div>

      {!isLastStep && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={step === 0 || busy} className={step === 0 ? "invisible" : undefined}>
            <IconArrowLeft data-icon="inline-start" aria-hidden />
            Back
          </Button>
          <Button type="button" size="lg" onClick={onNext} disabled={busy}>
            Continue
            <IconArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${WIZARD_STEP_COUNT}`}>
      {Array.from({ length: WIZARD_STEP_COUNT }).map((_, index) => (
        <span
          key={index}
          className={cn("h-1.5 flex-1 rounded-full transition-colors", index <= step ? "bg-primary" : "bg-primary/15")}
        />
      ))}
    </div>
  )
}

function StepField({
  id,
  label,
  value,
  placeholder,
  error,
  hint,
  disabled,
  inputMode,
  onChange,
  onEnter,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  error?: string
  hint: string
  disabled: boolean
  inputMode: "text" | "numeric"
  onChange: (value: string) => void
  onEnter: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            onEnter()
          }
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className="h-12 text-base"
      />
      <p className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{error ?? hint}</p>
    </div>
  )
}

function SelectableOption({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl border p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
        selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      {selected && <IconCheck className="ml-auto size-5 shrink-0 text-primary" aria-hidden />}
    </button>
  )
}

function CreateStep({
  draft,
  outputType,
  orientation,
  capability,
  exportState,
  busy,
  onRender,
  onCancel,
  onReset,
}: {
  draft: MilestoneDraft
  outputType: OutputType
  orientation: Orientation
  capability: ExportCapability | null
  exportState: ExportState
  busy: boolean
  onRender: () => void
  onCancel: () => void
  onReset: () => void
}) {
  const count = parseFollowerCount(draft.followerCount)
  const videoUnsupported = outputType === "video" && capability !== null && !capability.canRenderVideo

  if (busy) {
    const isVideo = exportState.status === "rendering"
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5">
        <ExportProgress
          progress={isVideo ? exportState.progress : 0.24}
          label={isVideo ? `Creating your ${exportState.format.toUpperCase()} video` : "Creating your image"}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">Keep this tab open while your device renders the file.</p>
        {isVideo && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    )
  }

  if (exportState.status === "complete") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <IconCheck className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium">{exportState.message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button type="button" size="lg" onClick={onRender}>
            <IconDownload data-icon="inline-start" aria-hidden />
            Download again
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={onReset}>
            Create another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-muted/30 p-4 text-sm">
        <SummaryRow label="Handle" value={`@${draft.handle}`} />
        <SummaryRow label="Milestone" value={count !== null ? `${formatFollowerCount(count)} followers` : "—"} />
        <SummaryRow label="Format" value={outputType === "video" ? "Animated video" : "Still image"} />
        <SummaryRow label="Orientation" value={orientation === "portrait" ? "Portrait" : "Landscape"} />
      </dl>

      <Button type="button" size="lg" onClick={onRender} disabled={videoUnsupported}>
        {outputType === "video" ? <IconVideo data-icon="inline-start" aria-hidden /> : <IconPhoto data-icon="inline-start" aria-hidden />}
        {outputType === "video"
          ? capability?.preferredFormat === "webm"
            ? "Create WebM video"
            : "Create MP4 video"
          : "Create image"}
        <IconDownload data-icon="inline-end" aria-hidden />
      </Button>

      {outputType === "video" && capability?.reason && (
        <p className="text-xs leading-relaxed text-muted-foreground">{capability.reason}</p>
      )}
      {exportState.status === "error" && <p className="text-sm text-destructive">{exportState.message}</p>}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
