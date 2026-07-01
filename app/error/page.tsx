import type { Metadata } from 'next'

import { ErrorContent } from './components/ErrorContent'

export const metadata: Metadata = {
  title: 'Error',
  robots: { index: false, follow: false },
}

type ErrorPageProps = {
  searchParams: Promise<{ twitter?: string; reason?: string }>
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { reason } = await searchParams

  return (
    <main className="min-h-screen flex justify-center items-center bg-background p-4 sm:p-6 md:p-8">
      <ErrorContent reason={reason} />
    </main>
  )
}
