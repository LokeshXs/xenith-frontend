"use client"

import Link from "next/link"
import { IconArrowRight, IconSparkles } from "@tabler/icons-react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function MilestoneCallout() {
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: EASE_OUT } },
  }

  return (
    <section className="container mx-auto px-4 py-14 sm:px-12 sm:py-20">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={container}
        className="relative overflow-hidden rounded-4xl border border-border bg-card p-6 shadow-md ring-1 ring-foreground/5 sm:p-10 lg:p-14"
      >
        {/* Soft brand glow — marks this out as a distinct free-tool band. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 -z-0 size-80 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
          {/* Left — copy */}
          <div className="flex flex-col items-start">
            <motion.div variants={item}>
              <Badge variant="secondary" className="gap-1">
                <IconSparkles data-icon="inline-start" aria-hidden />
                Free tool
              </Badge>
            </motion.div>

            <motion.h2
              variants={item}
              className="mt-5 text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl md:text-5xl"
            >
              Celebrate every follower <span className="hero-x-gradient">milestone</span>.
            </motion.h2>

            <motion.p
              variants={item}
              className="mt-4 max-w-md text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Turn any follower milestone into a share-ready animated video or image — enter your handle and count, and
              it renders right in your browser. Free, no login.
            </motion.p>

            <motion.div variants={item} className="mt-8">
              <Button size="lg" nativeButton={false} render={<Link href="/milestone" />}>
                Try the Milestone Maker
                <IconArrowRight data-icon="inline-end" aria-hidden />
              </Button>
            </motion.div>
          </div>

          {/* Right — looping demo in a phone frame */}
          <motion.div variants={item} className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[15rem] overflow-hidden rounded-[2rem] border border-border bg-background p-2 shadow-xl shadow-primary/10">
              <video
                src="/milestone-demo.mp4"
                poster="/milestone-demo.png"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Example milestone celebration video"
                className="aspect-[9/16] size-full rounded-[1.6rem] object-cover"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
