'use client'

import { cn } from '@/lib/utils'
import type { EngagementSignals } from '@/lib/services/posts'

// Display config for each signal, in the order shown in the tooltip. Order and
// labels match the approved design.
const SIGNALS: { key: keyof EngagementSignals; label: string }[] = [
  { key: 'p_like', label: 'Likes' },
  { key: 'p_reply', label: 'Replies' },
  { key: 'p_reply_engaged_by_author', label: 'Author replies' },
  { key: 'p_repost', label: 'Reposts' },
  { key: 'p_negative_feedback', label: 'Negative' },
]

// Mini horizontal bars showing each predicted-action probability (0–1) as a
// percentage. The signal that drove the final score (`topDriver`) is
// emphasized and marked with an arrow. Negative feedback reads as a penalty
// (rose), so it's visually distinct from the positive actions.
export function SignalBars({
  signals,
  topDriver,
}: {
  signals: EngagementSignals
  topDriver: keyof EngagementSignals
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {SIGNALS.map(({ key, label }) => {
        const pct = Math.round(Math.min(Math.max(signals[key] ?? 0, 0), 1) * 100)
        const isDriver = key === topDriver
        const isNegative = key === 'p_negative_feedback'

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
                  isNegative
                    ? 'bg-rose-500/70'
                    : isDriver
                      ? 'bg-primary'
                      : 'bg-foreground/30',
                )}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="w-7 shrink-0 text-right tabular-nums text-muted-foreground">
              {pct}%
            </span>
            <span
              aria-hidden
              className={cn('w-3 shrink-0 text-primary', !isDriver && 'opacity-0')}
            >
              ←
            </span>
          </div>
        )
      })}
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        ← drives the score
      </p>
    </div>
  )
}
