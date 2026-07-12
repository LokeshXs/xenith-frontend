"use client"

export function ExportProgress({ progress, label }: { progress: number; label: string }) {
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(4, progress * 100)}%` }} />
      </div>
    </div>
  )
}
