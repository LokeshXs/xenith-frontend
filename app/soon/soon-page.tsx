"use client"

import { useEffect, useState } from "react"
import { IconSparkles } from "@tabler/icons-react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { XenithLogo, XenithMark } from "@/components/brand/xenith-logo"
import { LogoutButton } from "@/components/auth/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const LAUNCH_AT = new Date("2026-06-27T00:00:00+05:30").getTime()
const EASE_OUT = [0.23, 1, 0.32, 1] as const

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const COUNTDOWN_UNITS: Array<{
  key: keyof TimeLeft
  label: string
}> = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
]

function getTimeLeft(now: number): TimeLeft | null {
  const difference = LAUNCH_AT - now

  if (difference <= 0) {
    return null
  }

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  }
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | undefined>(
    undefined,
  )

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(Date.now()) ?? null)

    update()
    const interval = window.setInterval(update, 1_000)

    return () => window.clearInterval(interval)
  }, [])

  if (timeLeft === null) {
    return (
      <div
        role="status"
        className="flex min-h-24 items-center justify-center rounded-2xl border border-border/80 bg-card/70 px-8 shadow-sm backdrop-blur-xl sm:min-h-28"
      >
        <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Launching soon
        </p>
      </div>
    )
  }

  return (
    <dl
      aria-label="Time remaining until Xenith launches"
      className="grid grid-cols-4 gap-2 sm:gap-3"
    >
      {COUNTDOWN_UNITS.map(({ key, label }) => {
        const value = timeLeft?.[key]

        return (
          <div
            key={key}
            className="flex min-w-0 flex-col items-center rounded-2xl border border-border/80 bg-card/70 px-2 py-4 shadow-sm backdrop-blur-xl sm:px-5 sm:py-5"
          >
            <dd
              aria-label={
                value === undefined ? `Loading ${label}` : `${value} ${label}`
              }
              className="tabular-nums text-2xl font-semibold tracking-tighter text-foreground sm:text-4xl"
            >
              {value === undefined ? "—" : String(value).padStart(2, "0")}
            </dd>
            <dt className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              {label}
            </dt>
          </div>
        )
      })}
    </dl>
  )
}

function LaunchMark() {
  return (
    <div className="relative flex size-44 items-center justify-center sm:size-52">
      
      <div
        aria-hidden
        className="soon-mark-glow absolute size-28 rounded-full bg-primary/20 blur-3xl sm:size-32"
      />
    
        
      
    </div>
  )
}

export function SoonPage() {
  const reduceMotion = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.07,
      },
    },
  }

  const item: Variants = {
    hidden: {
      opacity: 0,
      transform: reduceMotion ? "none" : "translateY(14px)",
    },
    show: {
      opacity: 1,
      transform: "translateY(0px)",
      transition: {
        duration: reduceMotion ? 0.15 : 0.45,
        ease: EASE_OUT,
      },
    },
  }

  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_22%,var(--accent)_0%,transparent_38%),linear-gradient(to_bottom,var(--background),var(--background))]"
      />
      <div
        aria-hidden
        className="soon-grid pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-3xl bg-primary/10 blur-[100px]"
      />

      <header className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 py-5 sm:px-8 sm:py-7">
        <div />
        <XenithLogo />
        <div className="flex items-center gap-2 justify-self-end">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex w-full max-w-2xl flex-col items-center text-center"
        >
          <motion.div variants={item} className="mb-12">
            <Badge variant="secondary" className="border border-primary">
              <IconSparkles data-icon="inline-start" aria-hidden />
              Launching soon
            </Badge>
          </motion.div>

    

          <motion.h1
            variants={item}
            className="text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl"
          >
            Your growth engine is almost ready.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Xenith is getting ready to help you write sharper posts, join the
            right conversations, and grow on X without living on it.
          </motion.p>

        

          <motion.div variants={item} className="mt-5 flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              27 June 2026
            </p>
           
          </motion.div>
        </motion.div>
      </main>

      <footer className="px-5 py-5 text-center sm:px-8 sm:py-7">
        <p className="text-xs text-muted-foreground">
          © Xenith 2026. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
