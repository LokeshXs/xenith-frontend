"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"

import { ComposerCard } from "@/components/landing/showcase/composer-card"
import { InboxCard } from "@/components/landing/showcase/inbox-card"
import { QueueCard } from "@/components/landing/showcase/queue-card"

const EASE_OUT = [0.23, 1, 0.32, 1] as const

function ClusterLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
      <span aria-hidden className="size-1.5 rounded-full bg-primary/60" />
      {children}
    </p>
  )
}

/**
 * The hero's floating-card showcase: trending inbox (left), the live composer
 * (center, focal), and the scheduled queue (right). Clusters stack vertically
 * on small screens and float around the composer from `lg` up.
 */
export function HeroShowcase() {
  const reduceMotion = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.1 } },
  }

  // Center composer: soft blur-to-sharp reveal with a small lift. The filter
  // is cleared after the animation so the card isn't held on a rasterized
  // GPU layer (which softens text).
  const item: Variants = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 10,
      filter: reduceMotion ? "blur(0px)" : "blur(10px)",
    },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: EASE_OUT },
      transitionEnd: { filter: "none" },
    },
  }

  // Side clusters resolve out of blur with only a faint directional drift —
  // the blur does the work, not distance. They settle flat (rotate: 0) with
  // the filter cleared so text re-rasterizes pixel-crisp at rest.
  // Blur/movement are zeroed under reduced motion.
  const blurIn = (from: "left" | "right"): Variants => {
    const tilt = reduceMotion ? 0 : from === "left" ? -1 : 1
    const drift = reduceMotion ? 0 : from === "left" ? -14 : 14
    return {
      hidden: {
        opacity: 0,
        x: drift,
        rotate: tilt,
        filter: reduceMotion ? "blur(0px)" : "blur(12px)",
      },
      show: {
        opacity: 1,
        x: 0,
        rotate: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: EASE_OUT },
        transitionEnd: { filter: "none" },
      },
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 pb-14 sm:px-12 sm:pb-28 lg:block lg:min-h-[480px] lg:gap-0"
    >
     

      <motion.div
        variants={blurIn("left")}
        className="hidden lg:absolute lg:left-0 lg:top-20 lg:block lg:w-auto"
      >
        <ClusterLabel>What&apos;s working now</ClusterLabel>
        <div className="flex flex-col items-center gap-3 lg:items-start">
          <InboxCard
            handle="@buildinpublic"
            views="18 min ago"
            lines={[
              "the fastest way to learn",
              "is to ship before",
              "you feel ready.",
            ]}
          />
          <InboxCard
            handle="@productnotes"
            views="31 min ago"
            lines={[
              "your users don't need",
              "more features. they need",
              "one problem gone.",
            ]}
            className="lg:ml-8"
          />
        </div>
      </motion.div>

      {/* Live composer — center, focal */}
      <motion.div
        variants={item}
        className="order-1 flex w-full justify-center lg:absolute lg:left-1/2 lg:top-0 lg:z-10 lg:-translate-x-1/2"
      >
        <ComposerCard />
      </motion.div>

      {/* Scheduled queue — right (hidden on small screens) */}
      <motion.div
        variants={blurIn("right")}
        className="hidden lg:absolute lg:right-0 lg:top-28 lg:block lg:w-auto"
      >
        <ClusterLabel>Ready for your schedule</ClusterLabel>
        <div className="flex flex-col items-center gap-3 lg:items-end">
          <QueueCard
            time="today · 9:00 AM"
            lines={["your next post is", "already written."]}
            predicted="Ready to publish"
          />
          <QueueCard
            time="today · 5:30 PM"
            lines={["one useful idea.", "written in your voice."]}
            predicted="Scheduled"
            className="lg:mr-8"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
