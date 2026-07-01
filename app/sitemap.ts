import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/seo/config"

// Only public, indexable routes belong here. Auth/utility/gated pages are
// noindex, so the landing page is currently the sole entry.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
