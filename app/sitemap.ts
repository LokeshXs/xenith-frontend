import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/seo/config"

// Only public, indexable routes belong here. Auth/utility/gated pages are
// noindex and stay out. `lastModified` uses the date each page's content last
// meaningfully changed — NOT `new Date()`, which would stamp "now" on every
// build and turn the freshness signal into noise.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: "2026-07-12",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/milestone`,
      lastModified: "2026-07-12",
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]
}
