import type { Metadata } from "next"

import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"
import { MilestoneGenerator } from "@/components/milestone/milestone-generator"
import { MilestoneHero } from "@/components/milestone/milestone-hero"

export const metadata: Metadata = {
  title: "Follower Milestone Maker",
  description:
    "Celebrate your X follower milestones with a free animated video or image. Enter your handle and count — everything renders in your browser.",
  robots: { index: true, follow: true },
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

export default function MilestonePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="flex-1">
        <MilestoneHero />
        <MilestoneGenerator />
      </main>
      <Footer />
    </div>
  )
}
