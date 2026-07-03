'use client'

import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import { MailIcon, TwitterIcon } from '@animateicons/react/lucide'

type AnimatedIcon = ForwardRefExoticComponent<
  {
    size?: number
    duration?: number
    isAnimated?: boolean
    color?: string
    className?: string
  } & RefAttributes<{ startAnimation: () => void; stopAnimation: () => void }>
>

const CONTACT_INFO: {
  label: string
  value: string
  href: string
  icon: AnimatedIcon
}[] = [
  {
    label: 'Email',
    value: 'hello@growwithxenith.com',
    href: 'mailto:hello@growwithxenith.com',
    icon: MailIcon,
  },
  {
    label: 'X',
    value: '@growwithxenith',
    href: 'https://x.com/growwithxenith',
    icon: TwitterIcon,
  },
]

export function ContactSupportClient() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reach out to us directly
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {CONTACT_INFO.map(({ label, value, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border">
              <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <span className="text-sm font-medium transition-colors group-hover:text-foreground">
                {value}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
