import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/seo/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / gated app surfaces — keep them out of the index.
      disallow: ["/dashboard", "/onboarding", "/billing"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
