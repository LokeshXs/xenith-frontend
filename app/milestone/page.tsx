import type { Metadata } from "next"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { MilestoneGenerator } from "@/components/milestone/milestone-generator"
import { MilestoneHero } from "@/components/milestone/milestone-hero"
import { siteConfig } from "@/lib/seo/config"

export const metadata: Metadata = {
  title: "Follower Milestone Maker",
  description:
    "Celebrate your X follower milestones with a free animated video or image. Enter your handle and count — everything renders in your browser.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/milestone" },
  openGraph: {
    title: "Follower Milestone Maker — Xenith",
    description:
      "Celebrate your X follower milestones with a free animated video or image, made in your browser.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Follower Milestone Maker — Xenith",
    description:
      "Celebrate your X follower milestones with a free animated video or image, made in your browser.",
  },
}

// The milestone maker is a free, browser-based tool. WebApplication markup with
// isAccessibleForFree makes that explicit for rich results and AI citation.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Follower Milestone Maker",
  url: `${siteConfig.url}/milestone`,
  description:
    "Celebrate your X follower milestones with a free animated video or image. Enter your handle and count — everything renders in your browser.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: { "@id": `${siteConfig.url}/#organization` },
}

export default function MilestonePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <MilestoneHero />
        <MilestoneGenerator />
      </main>
      <Footer />
    </div>
  )
}
