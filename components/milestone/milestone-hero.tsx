"use client"

import Link from "next/link"
import { IconArrowRight } from "@tabler/icons-react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { Button } from "@/components/ui/button"

// Strong ease-out curve — matches the landing hero entrance.
const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function MilestoneHero() {
  const reduceMotion = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
  }

  return (
    <section className="relative overflow-hidden">
      {/* Soft radial backdrop — decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--muted)_0%,transparent_70%)]"
      />

      <div className="container mx-auto grid items-center gap-12 px-4 pt-16 pb-20 sm:px-12 sm:pt-24 lg:grid-cols-2">
        {/* Left — copy */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          <motion.p variants={item} className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Free milestone maker
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Turn your next follower <span className="hero-x-gradient">milestone</span> into a moment.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-balance text-lg max-sm:text-base leading-relaxed text-muted-foreground"
          >
            Enter your handle and follower count — get a share-ready animated video or image, rendered right in your
            browser. Free, no login.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row lg:items-start">
            <Button size="lg" className="w-full min-w-[11.25rem] sm:w-auto" nativeButton={false} render={<Link href="#create" />}>
              Create yours
              <IconArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </motion.div>

          <motion.p variants={item} className="mt-5 text-sm text-muted-foreground">
            Free · No sign-up · Renders on your device
          </motion.p>
        </motion.div>

        {/* Right — looping demo in a phone frame */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.15 }}
          className="flex justify-center lg:justify-end"
        >
          <div className="w-full max-w-[18rem] overflow-hidden rounded-[2.5rem] border border-border bg-card p-2 shadow-2xl shadow-primary/10">
            <video
              src="/milestone-demo.mp4"
              poster="/milestone-demo.png"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Example milestone celebration video"
              className="aspect-[9/16] size-full rounded-[2rem] object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
