import type { Metadata } from "next"

import { SoonPage } from "./soon-page"

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s — Xenith" template so the
  // title doesn't become "Launching soon — Xenith — Xenith".
  title: { absolute: "Launching soon — Xenith" },
  description:
    "Xenith, your X growth engine, launches on June 27, 2026.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Launching soon — Xenith",
    description:
      "Xenith, your X growth engine, launches on June 27, 2026.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Launching soon — Xenith",
    description:
      "Xenith, your X growth engine, launches on June 27, 2026.",
  },
}

export default function Soon() {
  return <SoonPage />
}
