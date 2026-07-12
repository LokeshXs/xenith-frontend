"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Variants,
} from "motion/react"

import { IconMenu2 } from "@tabler/icons-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { XenithLogo } from "@/components/brand/xenith-logo"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Demo", href: "/#demo" },
]

// Smooth, critically-damped spring (Apple-style) — settles without overshoot,
// so the width + vertical morph reads as one fluid motion rather than a snap.
const CONDENSE_SPRING = { type: "spring", duration: 0.45, bounce: 0 } as const

// Strong ease-out (emil) for the mobile menu link cascade.
const EASE_OUT = [0.23, 1, 0.32, 1] as const

// How far the condensed pill drops away from the top edge (px). The header
// already holds it at `pt-3` (12px); this adds a little extra breathing room
// so the bar reads as a floating pill once detached from the top.
const CONDENSE_DROP = 12

/**
 * Marketing top navigation. Static links + auth CTAs.
 *
 * At the top the bar spans the full container width, flush against the top
 * edge. Once the page is scrolled past 10%, it condenses into a centered
 * frosted "pill" (60% of the container width) and floats down a touch, on
 * `md`+ screens. On mobile it spans the full screen edge-to-edge (squared, with
 * just a bottom divider) and never resizes on scroll — the center links collapse
 * into a hamburger that opens a drawer (Sheet) with the same links.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const { isAuthenticated } = useAuth()

  const ctaHref = isAuthenticated ? "/dashboard/todays-posts" : "/login"
  const ctaLabel = isAuthenticated ? "My Dashboard" : "Sign in"

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setScrolled(v > 0.1)
  })

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const condensed = scrolled && isDesktop

  // Mobile menu link cascade — each link rises up + fades in, staggered, once
  // the bottom sheet has slid into place. Replays on every open (the sheet
  // unmounts when closed). Reduced motion drops the movement + stagger.
  const menuContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.06,
        delayChildren: reduce ? 0 : 0.12,
      },
    },
  }
  const menuItem: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.35, ease: EASE_OUT },
    },
  }

  return (
    <header className="sticky top-0 z-50 flex justify-center px-0 md:px-6">
      <div className="flex w-full justify-center md:container">
        <motion.nav
          aria-label="Primary"
          initial={false}
          animate={{
            width: condensed ? "60%" : "100%",
            y: condensed ? CONDENSE_DROP : 0,
          }}
          transition={reduce ? { duration: 0 } : CONDENSE_SPRING}
          data-scrolled={scrolled}
          className="flex h-12 sm:h-16 items-center justify-between gap-6 rounded-none border-b border-transparent px-4 sm:px-6 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 ease-out data-[scrolled=true]:border-border/60 data-[scrolled=true]:bg-background/70 data-[scrolled=true]:supports-[backdrop-filter]:bg-background/60 md:rounded-2xl md:border data-[scrolled=true]:md:shadow-md"
        >
          <XenithLogo variant="tile" condensed={condensed} />

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" nativeButton={false} render={<Link href={ctaHref} />}>
              {ctaLabel}
            </Button>

            {/* Mobile: hamburger → drawer with the same nav links. */}
            <Sheet>
              <SheetTrigger
                aria-label="Open menu"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "md:hidden",
                )}
              >
                <IconMenu2 className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-2xl py-12"
              >
               
                <motion.nav
                  aria-label="Mobile"
                  className="flex flex-col items-center gap-1 px-4 pb-2"
                  initial="hidden"
                  animate="show"
                  variants={menuContainer}
                >
                  {NAV_LINKS.map((link) => (
                    <motion.div key={link.href} variants={menuItem}>
                      <SheetClose
                        nativeButton={false}
                        render={
                          <a
                            href={link.href}
                            className="block rounded-lg px-3 py-3 text-base font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
                          />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    </motion.div>
                  ))}
                </motion.nav>
              </SheetContent>
            </Sheet>
          </div>
        </motion.nav>
      </div>
    </header>
  )
}
