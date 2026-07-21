import Link from "next/link"
import { IconBrandX } from "@tabler/icons-react"

import { XenithLogo } from "@/components/brand/xenith-logo"
import { BrandWatermark } from "./brand-watermark"

type FooterLink = {
  label: string
  href: string
  external?: boolean
}

const LINKS: FooterLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Demo", href: "/#demo" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-conditions" },
]

const SOCIALS = [
  { label: "X", href: "https://x.com/growwithxenith", icon: IconBrandX },
]

const linkClasses =
  "rounded text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"

function FooterLink({ label, href, external }: FooterLink) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={linkClasses}>
        {label}
      </a>
    )
  }

  return (
    <Link href={href} className={linkClasses}>
      {label}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden ">
      <div className="container relative z-10 mx-auto px-4 pt-16 pb-[max(9vw,8rem)] sm:px-12">
        {/* Centered logo */}
        <div className="flex justify-center">
          <XenithLogo />
        </div>

        {/* Centered link row */}
        <nav
          aria-label="Footer"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </nav>

  

        {/* Bottom bar: copyright left, socials right */}
        <div className="mt-6 sm:mt-12 flex flex-col max-sm:flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
          <p className="hidden text-sm text-muted-foreground sm:block">
            © Xenith 2026. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-4 sm:items-end">
            <div className="flex items-center gap-4">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="rounded text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
            <a
              href="https://startupbase.io/products/xenith?utm_source=startupbase&utm_medium=badge&utm_campaign=launch-badge-light"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/launched-on-sb.svg"
                alt="Launched on StartupBase"
                width={193}
                height={55}
                style={{ height: 55, width: "auto" }}
              />
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex h-16 w-80 max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center justify-center sm:h-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.8),rgba(255,255,255,0)_72%)]" />
        <p className="relative text-center text-sm text-muted-foreground">
          Made by{" "}
          <a
            href="https://x.com/ShipItLokesh"
            target="_blank"
            rel="noreferrer"
            className="rounded font-medium text-primary/80 outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            @shipitlokesh
          </a>
        </p>
        <p className="relative mt-1 text-center text-xs text-muted-foreground sm:hidden">
          © Xenith 2026. All rights reserved.
        </p>
      </div>

      {/* Giant brand watermark, cropped at the bottom edge */}
      <BrandWatermark />
    </footer>
  )
}
