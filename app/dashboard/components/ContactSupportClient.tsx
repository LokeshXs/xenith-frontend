'use client'

import Image from 'next/image'
import { useRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import { useReducedMotion } from 'motion/react'
import { MailIcon, TwitterIcon } from '@animateicons/react/lucide'

type AnimatedIconHandle = {
  startAnimation: () => void
  stopAnimation: () => void
}

type AnimatedIcon = ForwardRefExoticComponent<
  {
    size?: number
    duration?: number
    isAnimated?: boolean
    color?: string
    className?: string
  } & RefAttributes<AnimatedIconHandle>
>

type ContactOption = {
  label: string
  title: string
  description: string
  value: string
  action: string
  href: string
  icon: AnimatedIcon
  imagePosition: string
  external?: boolean
}

const CONTACT_OPTIONS: ContactOption[] = [
  {
    label: 'Email support',
    title: 'Send us the full picture',
    description: 'Best for account questions, billing, and anything that needs context.',
    value: 'hello@growwithxenith.com',
    action: 'Write an email',
    href: 'mailto:hello@growwithxenith.com',
    icon: MailIcon,
    imagePosition: '30% center',
  },
  {
    label: 'Message us on X',
    title: 'Start a quick conversation',
    description: 'Reach out when a short message is the easiest way to get unstuck.',
    value: '@growwithxenith',
    action: 'Open X',
    href: 'https://x.com/growwithxenith',
    icon: TwitterIcon,
    imagePosition: '72% center',
    external: true,
  },
]

function ContactOptionCard({ option }: { option: ContactOption }) {
  const iconRef = useRef<AnimatedIconHandle>(null)
  const reduceMotion = useReducedMotion()
  const Icon = option.icon

  const startIconAnimation = () => {
    if (!reduceMotion) iconRef.current?.startAnimation()
  }

  return (
    <a
      href={option.href}
      {...(option.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      aria-label={`${option.action}: ${option.value}`}
      onMouseEnter={startIconAnimation}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      onFocus={startIconAnimation}
      onBlur={() => iconRef.current?.stopAnimation()}
      className="group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-4xl border border-foreground/10 bg-foreground text-background shadow-sm transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Image
        src="/background.png"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        style={{ objectPosition: option.imagePosition }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/38 to-black/15" />
      <div className="absolute inset-0 bg-linear-to-r from-black/30 to-transparent" />

      <div className="relative flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-white/25 bg-black/20 text-white shadow-sm backdrop-blur-sm">
          <Icon ref={iconRef} className="size-5" />
        </div>
        <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
          {option.label}
        </span>
      </div>

      <div className="relative space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        <div className="max-w-xs space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-white">{option.title}</h2>
          <p className="text-sm leading-5 text-white/75">{option.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-sm font-medium text-white">
          <span className="truncate">{option.value}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-white/90 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none">
            {option.action} <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </a>
  )
}

export function ContactSupportClient() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <header className="max-w-xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Xenith support
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Let&apos;s get you moving again.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Choose the channel that fits your question and we&apos;ll take it from there.
          </p>
        </div>
      </header>

      <section aria-label="Contact Xenith support" className="grid gap-4 md:grid-cols-2">
        {CONTACT_OPTIONS.map((option) => (
          <ContactOptionCard key={option.label} option={option} />
        ))}
      </section>

      <aside className="flex gap-4 rounded-3xl border border-border/80 bg-muted/35 p-5 sm:p-6">
        <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-primary/70" />
        <div className="space-y-1">
          <h2 className="font-medium tracking-tight">Reporting a bug?</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Include a screenshot, the page you were on, and what you expected to happen.
            That gives us the fastest path to a useful answer.
          </p>
        </div>
      </aside>
    </div>
  )
}
