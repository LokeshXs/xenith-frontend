import type { Metadata } from "next"

import { Navbar } from "@/components/landing/navbar"
import { CreatorTrialPopup } from "@/components/landing/creator-trial-popup"
import { Hero } from "@/components/landing/hero"
import { VideoDemo } from "@/components/landing/video-demo"
import { FeatureScroll } from "@/components/landing/feature-scroll"
import { BentoGrid } from "@/components/landing/bento-grid"
import { MilestoneCallout } from "@/components/landing/milestone-callout"
import { Pricing } from "@/components/landing/pricing"
import { Testimonials } from "@/components/landing/testimonials"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { siteConfig } from "@/lib/seo/config"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

// Structured data describing the product. Only facts actually rendered on the
// page (name, description, the real Creator plan price) — no invented ratings.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/opengraph-image.png`,
    },
    {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${siteConfig.url}/#organization` },
      offers: {
        "@type": "Offer",
        price: "29",
        priceCurrency: "USD",
        category: "Creator",
      },
    },
  ],
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <CreatorTrialPopup />
      <main className="flex-1">
        <Hero/>
        <VideoDemo />
        <FeatureScroll />
        <BentoGrid />
        <MilestoneCallout />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
