"use client"

import { useRef, useState } from "react"
import { IconPhotoUp, IconTrash } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MilestoneImageError, processMilestoneImage } from "@/lib/milestone/image"
import { cn } from "@/lib/utils"
import type { MilestoneImageTreatment, MilestoneProfileImage } from "@/types/milestone"

export function ProfileImageField({
  image,
  disabled,
  onChange,
}: {
  image: MilestoneProfileImage | null
  disabled: boolean
  onChange: (image: MilestoneProfileImage | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProcessing(true)
    setError(null)

    try {
      const dataUrl = await processMilestoneImage(file)
      onChange({ dataUrl, filename: file.name, treatment: image?.treatment ?? "photo" })
    } catch (caught) {
      setError(
        caught instanceof MilestoneImageError
          ? caught.message
          : "This image could not be read. Try another PNG, JPEG, or WebP file.",
      )
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function updateTreatment(treatment: MilestoneImageTreatment) {
    if (image) onChange({ ...image, treatment })
  }

  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled || processing}>
      <FieldLabel htmlFor="milestone-profile-image">Photo or logo</FieldLabel>
      <input
        ref={inputRef}
        id="milestone-profile-image"
        name="milestone-profile-image"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled || processing}
        aria-describedby="milestone-profile-image-description"
        aria-invalid={Boolean(error)}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {image ? (
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-background p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              size="lg"
              className={cn(
                "size-12",
                image.treatment === "logo" && "rounded-2xl after:rounded-2xl",
              )}
            >
              <AvatarImage
                src={image.dataUrl}
                alt="Uploaded milestone identity"
                className={cn(
                  image.treatment === "logo" && "rounded-2xl object-contain p-1",
                )}
              />
              <AvatarFallback>IMG</AvatarFallback>
            </Avatar>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{image.filename}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || processing}
              onClick={() => inputRef.current?.click()}
            >
              Change
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Remove photo or logo"
              disabled={disabled || processing}
              onClick={() => {
                setError(null)
                onChange(null)
              }}
            >
              <IconTrash aria-hidden />
            </Button>
          </div>

          <ToggleGroup
            value={[image.treatment]}
            onValueChange={(value) => {
              const treatment = value[0] as MilestoneImageTreatment | undefined
              if (treatment) updateTreatment(treatment)
            }}
            aria-label="Image treatment"
            variant="outline"
            className="w-full"
          >
            <ToggleGroupItem value="photo" className="flex-1">Photo</ToggleGroupItem>
            <ToggleGroupItem value="logo" className="flex-1">Logo</ToggleGroupItem>
          </ToggleGroup>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled || processing}
          onClick={() => inputRef.current?.click()}
        >
          <IconPhotoUp data-icon="inline-start" aria-hidden />
          {processing ? "Preparing Image…" : "Add Photo or Logo"}
        </Button>
      )}

      <FieldDescription id="milestone-profile-image-description">
        Optional. The image stays on your device.
      </FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  )
}
