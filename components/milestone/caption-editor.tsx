"use client"

import { IconCheck, IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import type { MilestoneCaptions, MilestoneCaptionStyle } from "@/lib/milestone/captions"

const CAPTION_LABELS: Record<MilestoneCaptionStyle, string> = {
  grateful: "Grateful",
  celebratory: "Celebratory",
  concise: "Concise",
}

export function CaptionEditor({
  captions,
  selectedStyle,
  onSelectStyle,
  onChange,
  onCopied,
}: {
  captions: MilestoneCaptions
  selectedStyle: MilestoneCaptionStyle
  onSelectStyle: (style: MilestoneCaptionStyle) => void
  onChange: (style: MilestoneCaptionStyle, value: string) => void
  onCopied: (style: MilestoneCaptionStyle) => void
}) {
  const { state, copy } = useCopyToClipboard({
    onCopySuccess: () => {
      toast.success("Caption Copied")
      onCopied(selectedStyle)
    },
    onCopyError: () => toast.error("Could Not Copy Caption. Select the Text and Copy It Manually."),
  })

  return (
    <section className="flex flex-col gap-4" aria-labelledby="milestone-caption-title">
      <div className="flex flex-col gap-1">
        <h3 id="milestone-caption-title" className="text-base font-semibold">Add a Caption</h3>
        <p className="text-sm text-muted-foreground">Choose a starting point, then make it yours.</p>
      </div>

      <ToggleGroup
        value={[selectedStyle]}
        onValueChange={(value) => {
          const style = value[0] as MilestoneCaptionStyle | undefined
          if (style) onSelectStyle(style)
        }}
        aria-label="Caption style"
        variant="outline"
        size="sm"
        className="grid w-full grid-cols-3"
      >
        {(Object.keys(CAPTION_LABELS) as MilestoneCaptionStyle[]).map((style) => (
          <ToggleGroupItem key={style} value={style} className="w-full">
            {CAPTION_LABELS[style]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Field>
        <FieldLabel htmlFor="milestone-caption">Caption</FieldLabel>
        <InputGroup>
          <InputGroupTextarea
            id="milestone-caption"
            name="milestone-caption"
            value={captions[selectedStyle]}
            onChange={(event) => onChange(selectedStyle, event.target.value)}
            className="min-h-32"
          />
          <InputGroupAddon align="block-end" className="justify-between">
            <InputGroupText>{captions[selectedStyle].length} characters</InputGroupText>
            <InputGroupButton
              variant="outline"
              size="sm"
              onClick={() => void copy(captions[selectedStyle])}
            >
              {state === "done" ? (
                <IconCheck data-icon="inline-start" aria-hidden />
              ) : (
                <IconCopy data-icon="inline-start" aria-hidden />
              )}
            
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </section>
  )
}
