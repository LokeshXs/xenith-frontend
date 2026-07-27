"use client"

import type { ReactNode } from "react"
import { IconArrowLeft, IconArrowRight, IconBrandX, IconCheck, IconDownload, IconPhoto, IconVideo } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatMilestoneCount, normalizeHandle, parseFollowerCount } from "@/lib/milestone/formatters"
import type { MilestoneCaptions, MilestoneCaptionStyle } from "@/lib/milestone/captions"
import { cn } from "@/lib/utils"
import type {
  ExportCapability,
  ExportState,
  MilestoneDraft,
  MilestoneNumberFormat,
  MilestoneProfileImage,
  MilestoneResult,
  Orientation,
  OutputType,
} from "@/types/milestone"
import { ExportProgress } from "./export-progress"
import { ProfileImageField } from "./profile-image-field"
import { CaptionEditor } from "./caption-editor"
import { PostExportCta } from "./post-export-cta"

export const WIZARD_STEP_COUNT = 6

type FieldErrors = Partial<Record<"handle" | "followerCount", string>>

const STEP_META = [
  { title: "What's your handle?", description: "This appears on your milestone." },
  { title: "Which milestone?", description: "The follower count you're celebrating." },
  { title: "Add a photo or logo?", description: "Optional. Personalize your milestone with your identity." },
  { title: "Image or video?", description: "Pick what you want to create." },
  { title: "Which layout?", description: "Choose the orientation for your post." },
  { title: "Create your milestone", description: "Everything renders on your device." },
] as const

export function MilestoneWizard({
  step,
  draft,
  errors,
  outputType,
  orientation,
  numberFormat,
  profileImage,
  capability,
  exportState,
  result,
  captions,
  selectedCaptionStyle,
  busy,
  onChange,
  onNext,
  onBack,
  onSelectOutputType,
  onSelectOrientation,
  onSelectNumberFormat,
  onProfileImageChange,
  onRender,
  onCancel,
  onReset,
  onShare,
  onDownload,
  onSelectCaptionStyle,
  onCaptionChange,
  onCaptionCopied,
}: {
  step: number
  draft: MilestoneDraft
  errors: FieldErrors
  outputType: OutputType
  orientation: Orientation
  numberFormat: MilestoneNumberFormat
  profileImage: MilestoneProfileImage | null
  capability: ExportCapability | null
  exportState: ExportState
  result: MilestoneResult | null
  captions: MilestoneCaptions
  selectedCaptionStyle: MilestoneCaptionStyle
  busy: boolean
  onChange: (field: "handle" | "followerCount", value: string) => void
  onNext: () => void
  onBack: () => void
  onSelectOutputType: (value: OutputType) => void
  onSelectOrientation: (value: Orientation) => void
  onSelectNumberFormat: (value: MilestoneNumberFormat) => void
  onProfileImageChange: (value: MilestoneProfileImage | null) => void
  onRender: () => void
  onCancel: () => void
  onReset: () => void
  onShare: () => void
  onDownload: () => void
  onSelectCaptionStyle: (value: MilestoneCaptionStyle) => void
  onCaptionChange: (style: MilestoneCaptionStyle, value: string) => void
  onCaptionCopied: (style: MilestoneCaptionStyle) => void
}) {
  const meta = STEP_META[step]
  const isLastStep = step === WIZARD_STEP_COUNT - 1

  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <StepIndicator step={step} />

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{meta.title}</h2>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <div className="min-h-[7rem]">
        {step === 0 && (
          <StepField
            id="handle"
            label="Your X handle"
            value={draft.handle}
            placeholder="@yourhandle…"
            error={errors.handle}
            hint="Use your public X username."
            disabled={busy}
            inputMode="text"
            onChange={(value) => onChange("handle", value)}
            onEnter={onNext}
          />
        )}

        {step === 1 && (
          <FieldGroup className="gap-5">
            <StepField
              id="follower-count"
              label="Follower milestone"
              value={draft.followerCount}
              placeholder="10K…"
              error={errors.followerCount}
              hint="Try 10K, 10,000, or 1.5M."
              disabled={busy}
              inputMode="numeric"
              onChange={(value) => onChange("followerCount", value)}
              onEnter={onNext}
            />
            <NumberFormatField
              count={parseFollowerCount(draft.followerCount)}
              value={numberFormat}
              disabled={busy}
              onChange={onSelectNumberFormat}
            />
          </FieldGroup>
        )}

        {step === 2 && (
          <ProfileImageField image={profileImage} disabled={busy} onChange={onProfileImageChange} />
        )}

        {step === 3 && (
          <ToggleGroup
            value={[outputType]}
            onValueChange={(value) => {
              const next = value[0] as OutputType | undefined
              if (next) onSelectOutputType(next)
            }}
            orientation="vertical"
            aria-label="Output type"
            className="w-full"
          >
            <SelectableOption
              value="video"
              icon={<IconVideo aria-hidden />}
              title="Animated video"
              description="A short MP4 with the number rolling up."
            />
            <SelectableOption
              value="image"
              icon={<IconPhoto aria-hidden />}
              title="Still image"
              description="A single PNG poster of your milestone."
            />
          </ToggleGroup>
        )}

        {step === 4 && (
          <ToggleGroup
            value={[orientation]}
            onValueChange={(value) => {
              const next = value[0] as Orientation | undefined
              if (next) onSelectOrientation(next)
            }}
            orientation="vertical"
            aria-label="Orientation"
            className="w-full"
          >
            <SelectableOption
              value="portrait"
              icon={<span className="block h-6 w-4 rounded-sm bg-current" />}
              title="Portrait"
              description="1080 × 1920 — Stories, Reels, and Shorts."
            />
            <SelectableOption
              value="square"
              icon={<span className="block size-5 rounded-sm bg-current" />}
              title="Square"
              description="1080 × 1080 — X and feed posts."
            />
            <SelectableOption
              value="landscape"
              icon={<span className="block h-4 w-6 rounded-sm bg-current" />}
              title="Landscape"
              description="1920 × 1080 — X, YouTube, and wide feeds."
            />
          </ToggleGroup>
        )}

        {step === 5 && (
          <CreateStep
            draft={draft}
            outputType={outputType}
            orientation={orientation}
            numberFormat={numberFormat}
            profileImage={profileImage}
            capability={capability}
            exportState={exportState}
            result={result}
            captions={captions}
            selectedCaptionStyle={selectedCaptionStyle}
            busy={busy}
            onRender={onRender}
            onCancel={onCancel}
            onReset={onReset}
            onShare={onShare}
            onDownload={onDownload}
            onSelectCaptionStyle={onSelectCaptionStyle}
            onCaptionChange={onCaptionChange}
            onCaptionCopied={onCaptionCopied}
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
            {step === 2 && !profileImage ? "Skip" : "Continue"}
            <IconArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-label={`Step ${step + 1} of ${WIZARD_STEP_COUNT}`}
      aria-valuemin={1}
      aria-valuemax={WIZARD_STEP_COUNT}
      aria-valuenow={step + 1}
    >
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
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
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
        aria-describedby={`${id}-description`}
        className="h-12 text-base"
      />
      {error ? (
        <FieldError id={`${id}-description`}>{error}</FieldError>
      ) : (
        <FieldDescription id={`${id}-description`}>{hint}</FieldDescription>
      )}
    </Field>
  )
}

function NumberFormatField({
  count,
  value,
  disabled,
  onChange,
}: {
  count: number | null
  value: MilestoneNumberFormat
  disabled: boolean
  onChange: (value: MilestoneNumberFormat) => void
}) {
  const previewCount = count ?? 10_000

  return (
    <Field data-disabled={disabled}>
      <FieldLabel id="number-format-label">Number style</FieldLabel>
      <ToggleGroup
        value={[value]}
        onValueChange={(nextValue) => {
          const next = nextValue[0] as MilestoneNumberFormat | undefined
          if (next) onChange(next)
        }}
        aria-labelledby="number-format-label"
        variant="outline"
        disabled={disabled}
        className="w-full"
      >
        <ToggleGroupItem value="full" className="flex-1">
          Full · {formatMilestoneCount(previewCount, "full")}
        </ToggleGroupItem>
        <ToggleGroupItem value="compact" className="flex-1">
          Compact · {formatMilestoneCount(previewCount, "compact")}
        </ToggleGroupItem>
      </ToggleGroup>
    </Field>
  )
}

function SelectableOption({
  value,
  icon,
  title,
  description,
}: {
  value: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <ToggleGroupItem
      value={value}
      className="group/option h-auto min-h-20 w-full justify-start gap-4 rounded-3xl border border-border p-4 text-left data-pressed:border-primary"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background text-muted-foreground transition-colors group-data-pressed/option:bg-primary-foreground/15 group-data-pressed/option:text-primary-foreground"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium group-data-pressed/option:text-primary-foreground">{title}</span>
        <span className="text-xs text-muted-foreground group-data-pressed/option:text-primary-foreground/80">{description}</span>
      </span>
      <IconCheck
        className="ml-auto shrink-0 text-primary-foreground opacity-0 group-data-pressed/option:opacity-100"
        aria-hidden
      />
    </ToggleGroupItem>
  )
}

function CreateStep({
  draft,
  outputType,
  orientation,
  numberFormat,
  profileImage,
  capability,
  exportState,
  result,
  captions,
  selectedCaptionStyle,
  busy,
  onRender,
  onCancel,
  onReset,
  onShare,
  onDownload,
  onSelectCaptionStyle,
  onCaptionChange,
  onCaptionCopied,
}: {
  draft: MilestoneDraft
  outputType: OutputType
  orientation: Orientation
  numberFormat: MilestoneNumberFormat
  profileImage: MilestoneProfileImage | null
  capability: ExportCapability | null
  exportState: ExportState
  result: MilestoneResult | null
  captions: MilestoneCaptions
  selectedCaptionStyle: MilestoneCaptionStyle
  busy: boolean
  onRender: () => void
  onCancel: () => void
  onReset: () => void
  onShare: () => void
  onDownload: () => void
  onSelectCaptionStyle: (value: MilestoneCaptionStyle) => void
  onCaptionChange: (style: MilestoneCaptionStyle, value: string) => void
  onCaptionCopied: (style: MilestoneCaptionStyle) => void
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

  if (result) {
    const isPortrait = orientation === "portrait"
    const isSquare = orientation === "square"
    const frameClass = cn(
      "overflow-hidden rounded-[2rem] border border-border bg-background p-2 shadow-xl shadow-primary/10",
      isPortrait ? "mx-auto w-full max-w-[17rem]" : isSquare ? "mx-auto w-full max-w-[24rem]" : "w-full",
    )
    const mediaClass = cn(
      "size-full rounded-[1.6rem] object-cover",
      isPortrait ? "aspect-[9/16]" : isSquare ? "aspect-square" : "aspect-video",
    )
    return (
      <div className="flex flex-col gap-5">
        <div className={frameClass}>
          {result.kind === "video" ? (
            <video src={result.url} autoPlay loop muted playsInline className={mediaClass} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.url} alt="Your milestone" className={mediaClass} />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Button type="button" size="lg" onClick={onShare}>
            <IconBrandX data-icon="inline-start" aria-hidden />
            Share on X
          </Button>
          <div className="flex gap-3">
            <Button type="button" size="lg" variant="outline" className="flex-1" onClick={onDownload}>
              <IconDownload data-icon="inline-start" aria-hidden />
              Download
            </Button>
            <Button type="button" size="lg" variant="outline" className="flex-1" onClick={onReset}>
              Create another
            </Button>
          </div>
        </div>
        <CaptionEditor
          captions={captions}
          selectedStyle={selectedCaptionStyle}
          onSelectStyle={onSelectCaptionStyle}
          onChange={onCaptionChange}
          onCopied={onCaptionCopied}
        />
        <PostExportCta />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-muted/30 p-4 text-sm">
        <SummaryRow label="Handle" value={`@${normalizeHandle(draft.handle)}`} />
        <SummaryRow label="Milestone" value={count !== null ? `${formatMilestoneCount(count, numberFormat)} followers` : "—"} />
        <SummaryRow label="Format" value={outputType === "video" ? "Animated video" : "Still image"} />
        <SummaryRow label="Orientation" value={orientation === "portrait" ? "Portrait" : orientation === "square" ? "Square" : "Landscape"} />
        <SummaryRow label="Number style" value={numberFormat === "full" ? "Full" : "Compact"} />
        <SummaryRow label="Identity" value={profileImage ? (profileImage.treatment === "photo" ? "Photo" : "Logo") : "None"} />
      </dl>

      <Button type="button" size="lg" onClick={onRender} disabled={videoUnsupported}>
        {outputType === "video" ? <IconVideo data-icon="inline-start" aria-hidden /> : <IconPhoto data-icon="inline-start" aria-hidden />}
        {outputType === "video"
          ? capability?.preferredFormat === "webm"
            ? "Create WebM video"
            : "Create MP4 video"
          : "Create image"}
        <IconArrowRight data-icon="inline-end" aria-hidden />
      </Button>

      {outputType === "video" && capability?.reason && (
        <p className="text-xs leading-relaxed text-muted-foreground">{capability.reason}</p>
      )}
      {exportState.status === "error" && <p role="alert" className="text-sm text-destructive">{exportState.message}</p>}
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
