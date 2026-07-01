/**
 * Single source of truth for site-level SEO metadata. Reused by the root
 * layout, per-page metadata, the dynamic OG image, robots.txt, and sitemap.xml
 * so titles, descriptions, and URLs never drift apart.
 */
export const siteConfig = {
  name: "Xenith",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://growwithxenith.com",
  title: "Xenith — Grow on X like you never log off",
  description:
    "Your X growth engine. Xenith writes posts and replies in your real voice, built around what's trending in your niche — so you grow on X without living on it.",
  tagline: "Grow on X like you never log off",
} as const
