"use client"

import { useRef } from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"

import { GenerateVisual } from "./generate-visual"
import { PublishVisual } from "./publish-visual"
import { ReplyVisual } from "./reply-visual"
import Image from "next/image"

import { cn } from "@/lib/utils"

type FeatureCard = {
  index: string
  eyebrow: string
  title: string
  description: string
}

const CARDS: FeatureCard[] = [
  {
    index: "01",
    eyebrow: "Your daily drafts",
    title: "Get 1–10 posts at the time you choose.",
    description:
      "Choose your topics, voice, and delivery time once. Xenith turns what's working in your niche into posts ready for you to review.",
  },
  {
    index: "02",
    eyebrow: "One-tap publishing",
    title: "Send a post to X without copy-paste.",
    description:
      "Change any line, publish it now, or choose a time. Your post goes from Xenith to X without opening another app.",
  },
  {
    index: "03",
    eyebrow: "Daily conversations",
    title: "Reply without living in the X feed.",
    description:
      "Xenith finds relevant posts and drafts replies in your voice. Pick one, edit it if you want, and join the conversation.",
  },
]

export function FeatureScroll() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  // 0 → section top pins to viewport top; 1 → section bottom meets viewport
  // bottom — exactly the lifetime of the sticky child below.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  // Percentage translate: each -100% is exactly one panel regardless of
  // viewport size, so no resize handling is needed. Unlike VideoDemo this
  // rides the raw progress — a spring on a pinned section lags the scrollbar
  // and feels disconnected from the scroll gesture.
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${(CARDS.length - 1) * 100}%`],
  )

  // Mobile/tablet (and reduced motion): the features stack vertically and
  // scroll normally, each with its visual shown. The horizontal scroll-jack is
  // desktop-only — on touch it's disorienting, and the visuals can't fit a
  // pinned full-screen panel. Both layouts share one #features anchor.
  return (
    <div id="features" className="scroll-mt-20">
      {/* Stacked — below lg, and the only layout under reduced motion. */}
      <section
        aria-label="Features"
        className={cn(
          "bg-primary text-primary-foreground",
          !reduceMotion && "lg:hidden",
        )}
      >
        <div className="space-y-16 px-4 py-14 sm:space-y-24 sm:px-12 sm:py-28">
          {CARDS.map((card) => (
            <FeatureCardContent key={card.index} card={card} />
          ))}
        </div>
      </section>

      {/* Horizontal scroll-jack — desktop only, skipped under reduced motion. */}
      {!reduceMotion && (
        <section
          ref={sectionRef}
          style={{ height: `${CARDS.length * 100}vh` }}
          className="relative hidden lg:block"
        >
          <div className="sticky top-0 h-screen relative overflow-hidden">
            <Image
              src="/background.png"
              alt=""
              fill
              className="object-cover mask-t-from-80% mask-x-to-100% mask-b-from-80% mask-r-from-60% mask-l-from-60% mask-r-to-100%"
            />
            <motion.div style={{ x, willChange: "transform" }} className="flex h-full">
              {CARDS.map((card) => (
                <div
                  key={card.index}
                  className="flex h-full w-screen shrink-0 items-center px-4 pt-16 sm:px-12"
                >
                  <FeatureCardContent card={card} />
                </div>
              ))}
            </motion.div>

            <div
              aria-hidden
              className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2"
            >
              {CARDS.map((card, i) => (
                <ProgressDot
                  key={card.index}
                  progress={scrollYProgress}
                  index={i}
                  count={CARDS.length}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/** Brightens as its panel centers in the viewport, dims as it leaves. */
function ProgressDot({
  progress,
  index,
  count,
}: {
  progress: MotionValue<number>
  index: number
  count: number
}) {
  // One keyframe per dot position so the input range stays within [0, 1] —
  // offsets outside that range break Motion's WAAPI scroll acceleration
  // ("Offsets must be monotonically non-decreasing").
  const step = 1 / (count - 1)
  const positions = Array.from({ length: count }, (_, i) => i * step)
  const opacity = useTransform(
    progress,
    positions,
    positions.map((_, i) => (i === index ? 1 : 0.35)),
  )

  return (
    <motion.span
      style={{ opacity }}
      className="size-2 rounded-full bg-primary-foreground"
    />
  )
}

function FeatureCardContent({ card }: { card: FeatureCard }) {
  return (
    <div className="mx-auto grid w-full container gap-10 lg:grid-cols-2 lg:items-center ">
      <div>

        <p className="mt-6 text-xs drop-shadow-xs  font-semibold uppercase tracking-[0.2em] opacity-70">
          {card.eyebrow}
        </p>
        <h2 className="mt-4 text-balance drop-shadow-sm  text-xl font-semibold tracking-tight sm:text-5xl">
          {card.title}
        </h2>
        <p className="mt-5 max-w-xl drop-shadow-sm  text-balance text-sm sm:text-lg leading-relaxed opacity-80">
          {card.description}
        </p>
      </div>

      {/* Inverted glass panel — bg-card/border-border read poorly on purple.
          Taller (square) on phones so the scene has room; 4:3 from sm up. */}
      <div className="relative  rounded-3xl border border-white/15 bg-primary p-2 backdrop-blur-sm sm:aspect-[4/3] sm:p-6 h-fit">
        <FeatureVisual index={card.index} />
      </div>
    </div>
  )
}

/** Panel visuals: an animated scene for 01, skeleton mocks for the rest. */
function FeatureVisual({ index }: { index: string }) {
  if (index === "01") {
    // Generate: looping analyze → write → publish scene.
    return <GenerateVisual />
  }

  if (index === "02") {
    // Publish: a cursor taps Publish, the draft lifts off and lands as a live
    // X post with engagement ticking up — alternating with a schedule beat.
    return <PublishVisual />
  }

  // Reply: a post arrives, a reply card slides in, the status badge cycles
  // analyze → match voice → generate, then the suggested reply types out.
  return <ReplyVisual />
}
