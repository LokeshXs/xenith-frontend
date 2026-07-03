"use client";

import Link from "next/link";
import { IconSparkles } from "@tabler/icons-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { HeroShowcase } from "./showcase/hero-showcase";
import Image from "next/image";

// Strong ease-out curve (emil): starts fast, feels responsive on entrance.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  // Movement is dropped under reduced-motion; only opacity remains.
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.06 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: EASE_OUT },
    },
  };

  return (
    <section className="relative overflow-hidden container mx-auto">
      {/* Soft radial backdrop — decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--muted)_0%,transparent_70%)]"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 pb-20 text-center sm:px-12 sm:pt-20"
      >
        <motion.p
          variants={item}
          className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
        >
          Your X growth system
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Never wonder what to post on{" "}
          <span className="hero-x-gradient">X</span> again.
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-balance text-lg max-sm:text-base leading-relaxed text-muted-foreground"
        >
          Xenith turns what&apos;s working in your niche into posts and replies
          that sound like you.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-9 flex flex-col items-center gap-3"
        >
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Create my first post
            <IconSparkles data-icon="inline-end" aria-hidden />
          </Button>
       
        </motion.div>
      </motion.div>

      <div className=" relative ">
        {/* Background image — soft fade-in, opacity only so it's reduced-motion safe. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.5 }}
          className="absolute top-0 left-0 w-full h-full -translate-y-12 rounded-3xl overflow-hidden"
        >
          <Image
            src="/background.png"
            alt="Background Image"
            fill
            className="object-cover mask-t-from-80% mask-x-to-100% mask-b-from-80% mask-r-from-60% mask-l-from-60% mask-r-to-100%"
          />
        </motion.div>
        <HeroShowcase />
      </div>
    </section>
  );
}
