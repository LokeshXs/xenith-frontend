"use client"

export function ExportProgress({ progress, label }: { progress: number; label: string }) {
  const percentage = Math.round(progress * 100)

  return (
    <div
      className="flex flex-col gap-2"
      role="progressbar"
      aria-live="polite"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(4, progress * 100)}%` }} />
      </div>
    </div>
  )
}
