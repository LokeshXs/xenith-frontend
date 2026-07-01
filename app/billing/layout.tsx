import type { Metadata } from 'next'

// Billing pages are post-checkout / account flows — never indexed. A server
// layout lets us attach metadata without touching the client `success` page.
export const metadata: Metadata = {
  title: 'Billing',
  robots: { index: false, follow: false },
}

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
