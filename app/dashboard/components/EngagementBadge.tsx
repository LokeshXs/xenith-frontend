import { cn } from '@/lib/utils'

export interface EngagementBand {
  key: 'strong' | 'solid' | 'average' | 'weak'
  label: string
  // Tailwind classes for the pill (tinted bg + border + text).
  className: string
}

// The backend returns a raw 0–100 number; the frontend owns the bands.
// null is handled by callers (no band) — this only maps real scores.
export function getEngagementBand(score: number): EngagementBand {
  if (score >= 80)
    return {
      key: 'strong',
      label: 'Strong',
      className:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    }
  if (score >= 60)
    return {
      key: 'solid',
      label: 'Solid',
      className:
        'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    }
  if (score >= 40)
    return {
      key: 'average',
      label: 'Average',
      className:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    }
  return {
    key: 'weak',
    label: 'Weak',
    className:
      'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  }
}

// Compact pill showing the predicted-engagement score + band. Renders nothing
// when the post wasn't scored (null) so
// callers can drop it in unconditionally. `stale` dims it after a heavy edit,
// since the backend doesn't re-score on save.
export function EngagementBadge({
  score,
  stale = false,
  className,
}: {
  score: number | null
  stale?: boolean
  className?: string
}) {
  if (score === null || score === undefined) return null

  const band = getEngagementBand(score)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
        band.className,
        stale && 'opacity-60',
        className,
      )}
      aria-label={`Engagement score ${score} out of 100, ${band.label}${
        stale ? ', may be outdated after editing' : ''
      }`}
    >
      {score}
      <span className="font-medium opacity-80">{band.label}</span>
    </span>
  )
}
