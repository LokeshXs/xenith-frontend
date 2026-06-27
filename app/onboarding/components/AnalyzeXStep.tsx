'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Button } from '@/components/ui/button'
import { XenithMark } from '@/components/brand/xenith-logo'
import { useFormContext } from '../context/FormContext'
import { doTwitterPostsAnalysis } from '@/lib/services/twitter'
import { getErrorMessage } from '../utils/getErrorMessage'

type Phase = 'analyzing' | 'done' | 'error'

// Strong ease-out curve (emil): starts fast, feels responsive. Matches the hero.
const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Truthful descriptions of what the profile analysis actually does, cycled
// while the request is in flight so the wait feels intentional.
const STATUS_LINES = [
  'Reading your recent posts…',
  'Picking up your tone & voice…',
  'Almost there…',
]

// Beat between leaving this step and the next, so the "done" state is seen.
const ADVANCE_DELAY = 900

export function AnalyzeXStep() {
  const { statusSteps, goToNextStep, updateFormData } = useFormContext()
  const reduceMotion = useReducedMotion()

  const xConnected = statusSteps?.xAccount ?? false
  const hasStyleProfile = statusSteps?.styleProfile ?? false

  const [phase, setPhase] = useState<Phase>(() =>
    hasStyleProfile ? 'done' : 'analyzing',
  )
  const [error, setError] = useState<string | null>(null)
  // Bumped on retry to re-run the analysis effect.
  const [retryToken, setRetryToken] = useState(0)

  // Run (or skip) the analysis, then move the user on to the niche step.
  useEffect(() => {
    // Nothing to analyze — user skipped connecting X. Move straight along.
    if (!xConnected) {
      goToNextStep()
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    // Already analyzed previously: just confirm, then continue.
    if (hasStyleProfile) {
      timer = setTimeout(() => {
        if (!cancelled) goToNextStep()
      }, ADVANCE_DELAY)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    ;(async () => {
      try {
        const result = await doTwitterPostsAnalysis()
        if (cancelled) return
        // Keep the personalized niche suggestions and seed the selection with
        // the server's recommended subset.
        updateFormData({
          suggestedNiches: result.suggestedNiches,
          niche: result.preselectedNiches,
        })
        setPhase('done')
        timer = setTimeout(() => {
          if (!cancelled) goToNextStep()
        }, ADVANCE_DELAY)
      } catch (err: unknown) {
        if (cancelled) return
        setError(getErrorMessage(err, 'Failed to analyze your X posts. Please try again.'))
        setPhase('error')
      }
    })()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // goToNextStep / updateFormData are one-shot actions, not reactive inputs.
    // Excluding them keeps storing the result from re-running the analysis or
    // cancelling the advance timer (updateFormData re-renders the provider).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xConnected, hasStyleProfile, retryToken])

  function handleRetry() {
    setError(null)
    setPhase('analyzing')
    setRetryToken((t) => t + 1)
  }

  // Skipping when X isn't connected unmounts before paint; render nothing.
  if (!xConnected) return null

  const eyebrow =
    phase === 'done'
      ? 'All set'
      : phase === 'error'
        ? "Couldn't finish"
        : 'Analyzing your X'

  // Movement is dropped under reduced-motion; only opacity remains (matches hero).
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
  }

  return (
    <div className="relative flex flex-col items-center gap-7 py-10 text-center">
      {/* Soft radial backdrop — decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_35%,var(--muted)_0%,transparent_70%)]"
      />
   <motion.h2
          variants={item}
          initial="hidden"
          animate="show"
          className="text-xl font-semibold tracking-tight sm:text-3xl"
        >
          {phase === 'done' ? (
            <>
              We&apos;ve got your <em>voice</em>
            </>
          ) : phase === 'error' ? (
            <>
              We hit a <em>snag</em>
            </>
          ) : (
            <>
              Learning your <em>style</em>
            </>
          )}
        </motion.h2>
      <Indicator phase={phase} reduceMotion={!!reduceMotion} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-2 "
      >
        <motion.p
          variants={item}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
        >
          {eyebrow}
        </motion.p>

     

        <motion.div variants={item} className="mt-6 sm:mt-10">
          {phase === 'analyzing' && <CyclingStatus />}
          {phase === 'done' && (
            <p className="text-muted-foreground">Tailoring posts to sound like you.</p>
          )}
          {phase === 'error' && <p className="text-sm text-destructive">{error}</p>}
        </motion.div>
      </motion.div>

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <Button onClick={handleRetry}>Try again</Button>
       
        </div>
      )}
    </div>
  )
}

function Indicator({
  phase,
  reduceMotion,
}: {
  phase: Phase
  reduceMotion: boolean
}) {
  if (phase === 'done') {
    return (
      <div className="analyze-badge-in grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_-8px_var(--primary)]">
        <IconCheck size={28} stroke={2.5} />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
        <IconAlertTriangle size={26} />
      </div>
    )
  }

  // Analyzing: the brand X mark sits still while soft sonar rings ripple
  // outward from it over a gentle violet glow.
  return (
    <div className="relative grid size-28 place-items-center">
      <span
        aria-hidden
        className="analyze-glow absolute -inset-2 rounded-full bg-primary/30 blur-2xl"
      />
      <span
        aria-hidden
        className="analyze-ripple absolute size-16 rounded-full border border-primary/40"
      />
      <span
        aria-hidden
        className="analyze-ripple absolute size-16 rounded-full border border-primary/40 [animation-delay:-1.3s]"
      />
      <motion.div
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="relative"
      >
        <XenithMark variant="tile" className="size-14" />
      </motion.div>
    </div>
  )
}

function CyclingStatus() {
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<'in' | 'out'>('in')

  // Step through the status lines, pausing on the last one. The brief 'out'
  // state drives the blur/translate crossfade defined in globals.css.
  useEffect(() => {
    if (index >= STATUS_LINES.length - 1) return
    const out = setTimeout(() => setState('out'), 2000)
    const swap = setTimeout(() => {
      setIndex((i) => i + 1)
      setState('in')
    }, 2180)
    return () => {
      clearTimeout(out)
      clearTimeout(swap)
    }
  }, [index])

  return (
    <p
      className="analyze-copy text-muted-foreground"
      data-state={state}
      aria-live="polite"
    >
      {STATUS_LINES[index]}
    </p>
  )
}
