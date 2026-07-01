import type { Metadata } from "next"

import { XenithLogo, XenithMark } from "@/components/brand/xenith-logo"
import { LogoDownloads } from "./LogoDownloads"

export const metadata: Metadata = {
  title: "Logo preview",
  robots: { index: false, follow: false },
}

type Variant = "tile" | "glyph"

function VariantBlock({ variant }: { variant: Variant }) {
  return (
    <div className="space-y-6">
      {/* Mark at three scales. */}
      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <XenithMark variant={variant} className="size-6" />
          <span className="text-xs text-muted-foreground">size-6</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <XenithMark variant={variant} className="size-10" />
          <span className="text-xs text-muted-foreground">size-10</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <XenithMark variant={variant} className="size-16" />
          <span className="text-xs text-muted-foreground">size-16</span>
        </div>
      </div>

      {/* Full lockup. */}
      <XenithLogo variant={variant} href={null} />
    </div>
  )
}

function Panel({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <div className={className}>
      <div className="rounded-xl border border-border bg-background p-8">
        <p className="mb-6 text-sm font-medium text-muted-foreground">{label}</p>
        <div className="grid gap-12 sm:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tile</h3>
            <VariantBlock variant="tile" />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Glyph</h3>
            <VariantBlock variant="glyph" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LogoPreviewPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Xenith logo — compare</h1>
        <p className="text-sm text-muted-foreground">
          Two treatments of the gapped-X mark. Pick the one you like best.
        </p>
      </header>

      <LogoDownloads />

      <Panel label="Light theme" className="" />
      <Panel label="Dark theme" className="dark" />

      {/* Pure-white panel to check the gradient against a stark background. */}
      <div className="rounded-xl border border-border bg-white p-8">
        <p className="mb-6 text-sm font-medium text-zinc-500">On pure white</p>
        <div className="flex flex-wrap items-center gap-12">
          <XenithMark variant="tile" className="size-12" />
          <XenithMark variant="glyph" className="size-12" />
        </div>
      </div>
    </main>
  )
}
