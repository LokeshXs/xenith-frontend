'use client'

import { cn } from '@/lib/utils'
import type { EngagementSignals } from '@/lib/services/posts'

// Display only user-facing post actions. The backend still uses additional
// internal scoring signals, but those are intentionally hidden from the UI.
const SIGNALS: {
  key: keyof EngagementSignals
  label: string
  barClassName: string
  valueClassName: string
}[] = [
  {
    key: 'p_like',
    label: 'Likes',
    barClassName: 'bg-rose-400',
    valueClassName: 'text-rose-500',
  },
  {
    key: 'p_reply',
    label: 'Replies',
    barClassName: 'bg-sky-500',
    valueClassName: 'text-sky-600 dark:text-sky-400',
  },
  {
    key: 'p_repost',
    label: 'Reposts',
    barClassName: 'bg-emerald-500',
    valueClassName: 'text-emerald-600 dark:text-emerald-400',
  },
]

// Mini horizontal bars showing each predicted-action probability (0–1) as a
// percentage. The signal that drove the final score (`topDriver`) is
// emphasized only when it is one of the visible user-facing actions.
export function SignalBars({
  signals,
  topDriver,
  className,
}: {
  signals: EngagementSignals
  topDriver: keyof EngagementSignals
  className?: string
}) {
  const showsTopDriver = SIGNALS.some(({ key }) => key === topDriver)

  return (
    <div className={cn('mt-2 flex flex-col gap-1.5', className)}>
      {SIGNALS.map(({ key, label, barClassName, valueClassName }) => {
        const pct = Math.round(Math.min(Math.max(signals[key] ?? 0, 0), 1) * 100)
        const isDriver = key === topDriver

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={cn(
                'w-24 shrink-0 truncate text-left',
                isDriver ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none',
                  barClassName,
                  !isDriver && 'opacity-70',
                )}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span
              className={cn(
                'w-7 shrink-0 text-right tabular-nums',
                isDriver ? valueClassName : 'text-muted-foreground',
              )}
            >
              {pct}%
            </span>
            <span
              aria-hidden
              className={cn('w-3 shrink-0', valueClassName, !isDriver && 'opacity-0')}
            >
              ←
            </span>
          </div>
        )
      })}
      {showsTopDriver && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          ← drives the score
        </p>
      )}
    </div>
  )
}
