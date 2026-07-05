"use client"

import { Fragment, useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const AUTO_ADVANCE_MS = 5000
const QUOTE_WORD_DURATION = 0.52
const QUOTE_WORD_STAGGER = 0.075

type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Xenith gives me a clean starting point every day. As a solo builder, it saves me from staring at a blank composer and helps me stay consistent on X.",
    name: "Adarsh Yadav",
    role: "Solo builder · India",
    initials: "AY",
  },
  {
    quote:
      "I use Xenith to turn product updates and small learnings into posts that sound natural. The drafts feel close to how I would write them myself.",
    name: "Riya Mehta",
    role: "Indie maker · India",
    initials: "RM",
  },
  {
    quote:
      "The biggest win is speed. I can review a few thoughtful drafts, make quick edits, and keep my content queue moving without overthinking it.",
    name: "Marcus Reed",
    role: "SaaS founder · United States",
    initials: "MR",
  },
]

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [manualUntil, setManualUntil] = useState<number | null>(null)
  const [progressKey, setProgressKey] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const reduce = useReducedMotion()
  const active = TESTIMONIALS[activeIndex]

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(document.visibilityState === "visible")
    }

    updateVisibility()
    document.addEventListener("visibilitychange", updateVisibility)

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % TESTIMONIALS.length)
      setProgressKey((current) => current + 1)
      setManualUntil(null)
    }, AUTO_ADVANCE_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activeIndex, isVisible, manualUntil])

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.01 : 0.5, ease: EASE_OUT },
    },
  }

  const testimonial: Variants = {
    enter: { opacity: 0 },
    center: {
      opacity: 1,
      transition: { duration: reduce ? 0.01 : 0.18, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      transition: { duration: reduce ? 0.01 : 0.18, ease: EASE_OUT },
    },
  }

  const quoteWord: Variants = {
    enter: (index = 0) => ({
      opacity: reduce ? 1 : 0,
      y: reduce ? 0 : 4,
      filter: reduce ? "none" : "blur(10px)",
      transition: {
        duration: reduce ? 0 : QUOTE_WORD_DURATION,
        ease: EASE_OUT,
        delay: reduce ? 0 : index * QUOTE_WORD_STAGGER,
      },
    }),
    center: (index = 0) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: reduce ? 0 : QUOTE_WORD_DURATION,
        ease: EASE_OUT,
        delay: reduce ? 0 : index * QUOTE_WORD_STAGGER,
      },
    }),
    exit: {
      opacity: 0,
      transition: { duration: reduce ? 0 : 0.12, ease: EASE_OUT },
    },
  }

  const avatarPicture: Variants = {
    enter: {
      opacity: reduce ? 1 : 0,
      filter: reduce ? "none" : "blur(10px)",
    },
    center: {
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: reduce ? 0 : 0.36,
        ease: EASE_OUT,
      },
    },
    exit: {
      opacity: 0,
      filter: reduce ? "none" : "blur(10px)",
      transition: {
        duration: reduce ? 0 : 0.22,
        ease: EASE_OUT,
      },
    },
  }

  const authorText: Variants = {
    enter: (delay = 0) => ({
      opacity: reduce ? 1 : 0,
      y: reduce ? 0 : 10,
      transition: {
        duration: reduce ? 0 : 0.36,
        ease: EASE_OUT,
        delay: reduce ? 0 : delay,
      },
    }),
    center: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduce ? 0 : 0.36,
        ease: EASE_OUT,
        delay: reduce ? 0 : delay,
      },
    }),
    exit: {
      opacity: 0,
      y: reduce ? 0 : -4,
      transition: {
        duration: reduce ? 0 : 0.14,
        ease: EASE_OUT,
      },
    },
  }

  const showTestimonial = (index: number, eventTime: number) => {
    setActiveIndex(index)
    setProgressKey((current) => current + 1)
    setManualUntil(eventTime + AUTO_ADVANCE_MS)
  }

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="container mx-auto px-4 pb-14 sm:px-8 sm:pb-24 lg:px-12 lg:pb-28"
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={container}
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        

        <motion.div
          variants={item}
          className="relative mt-8 flex min-h-[20rem] w-full flex-col items-center justify-center sm:mt-10 sm:min-h-[21rem] lg:mt-12 lg:min-h-[23rem]"
        >
          <AnimatePresence mode="wait">
            <motion.figure
              key={`${active.name}-${progressKey}`}
              variants={testimonial}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex w-full max-w-full flex-col items-center px-1"
            >
              <blockquote className="relative w-full max-w-[42rem] text-balance text-base font-medium leading-snug tracking-tight text-foreground sm:text-lg md:text-xl md:leading-tight">
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block align-top text-primary"
                >
                  &ldquo;
                </span>
                <span className="break-words">
                  <QuoteWords text={active.quote} variants={quoteWord} />
                </span>
                <span
                  aria-hidden="true"
                  className="ml-2 inline-block align-bottom text-primary"
                >
                  &rdquo;
                </span>
              </blockquote>

              <figcaption className="mt-8 flex max-w-full items-center justify-center gap-3 text-left sm:mt-10 sm:gap-4">
                <div className="relative size-10 shrink-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${active.initials}-${progressKey}`}
                      variants={avatarPicture}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="absolute inset-0"
                    >
                      <Avatar size="lg" className="bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                          {active.initials}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="min-w-0 max-w-[calc(100vw-7rem)] sm:max-w-none">
                  <motion.p
                    variants={authorText}
                    custom={0}
                    className="truncate text-sm font-semibold text-foreground sm:text-base"
                  >
                    {active.name}
                  </motion.p>
                  <motion.p
                    variants={authorText}
                    custom={0.3}
                    className="mt-0.5 max-w-[15rem] truncate text-xs text-muted-foreground sm:max-w-none sm:text-sm"
                  >
                    {active.role}
                  </motion.p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={item}
          aria-label="Choose testimonial"
          className="mt-4 flex w-full max-w-80 items-center justify-center gap-1.5 sm:mt-6 sm:max-w-[28rem] sm:gap-2"
        >
          {TESTIMONIALS.map((testimonialItem, index) => {
            const selected = activeIndex === index

            return (
              <button
                key={testimonialItem.name}
                type="button"
                aria-label={`Show testimonial from ${testimonialItem.name}`}
                aria-current={selected ? "true" : undefined}
                onClick={(event) => showTestimonial(index, event.timeStamp)}
                className={cn(
                  "relative flex h-7 flex-1 items-center overflow-hidden rounded-full outline-none transition-opacity duration-200 ease-out hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected ? "opacity-100" : "opacity-70 hover:opacity-90"
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted-foreground/25"
                />
                <motion.span
                  key={selected ? `active-${index}-${progressKey}` : `inactive-${index}`}
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-foreground"
                  initial={{ scaleX: selected && !reduce ? 0 : selected ? 1 : 0 }}
                  animate={{ scaleX: selected ? 1 : 0 }}
                  transition={
                    selected
                      ? {
                          duration: reduce ? 0 : AUTO_ADVANCE_MS / 1000,
                          ease: "linear",
                        }
                      : { duration: 0 }
                  }
                  style={{ transformOrigin: "left" }}
                />
                <span className="sr-only">{testimonialItem.name}</span>
              </button>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}

function QuoteWords({
  text,
  variants,
}: {
  text: string
  variants: Variants
}) {
  const words = text.split(" ")

  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            variants={variants}
            custom={index}
            className="inline-block"
          >
            {word}
          </motion.span>{" "}
        </Fragment>
      ))}
    </>
  )
}
