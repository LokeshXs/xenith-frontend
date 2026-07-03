/**
 * Single source of truth for site-level SEO metadata. Reused by the root
 * layout, per-page metadata, the dynamic OG image, robots.txt, and sitemap.xml
 * so titles, descriptions, and URLs never drift apart.
 */
export const siteConfig = {
  name: "Xenith",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://growwithxenith.com",
  title: "Xenith - AI Growth Engine for X",
  description:
    "Grow faster on X with AI-powered content, replies, engagement insights, and workflow tools built to help creators and teams turn conversations into consistent growth.",
  tagline: "Turn X into a growth channel.",
} as const
