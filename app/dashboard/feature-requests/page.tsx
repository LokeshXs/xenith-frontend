import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { FeatureRequestsClient } from '../components/FeatureRequestsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Feature requests' }

export default async function FeatureRequestsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    redirect('/login')
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6 md:p-8">
      <FeatureRequestsClient />
    </div>
  )
}
