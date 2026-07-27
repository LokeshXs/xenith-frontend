const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_EDGE = 512

export class MilestoneImageError extends Error {
  constructor(
    message: string,
    public readonly code: "unsupported" | "too_large" | "decode_failed",
  ) {
    super(message)
    this.name = "MilestoneImageError"
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Image decode failed"))
    image.src = url
  })
}

export async function processMilestoneImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new MilestoneImageError("Choose a PNG, JPEG, or WebP image.", "unsupported")
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new MilestoneImageError("Choose an image smaller than 5 MB.", "too_large")
  }

  const sourceUrl = URL.createObjectURL(file)

  try {
    const image = await loadHtmlImage(sourceUrl)
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas unavailable")
    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL("image/png")
  } catch (error) {
    if (error instanceof MilestoneImageError) throw error
    throw new MilestoneImageError(
      "This image could not be read. Try another PNG, JPEG, or WebP file.",
      "decode_failed",
    )
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}
